"""Monthly salary deductions.

UNZALARU recovers loans through salary deductions. Each month it sends
payroll a deduction list (every member's installment due that month plus
arrears from earlier months); after payroll runs, an admin confirms what
was actually deducted, either by ticking the list or by uploading payroll's
return, and the deductions are recorded as repayments.
"""
import calendar
import csv
import io
from datetime import date
from decimal import Decimal, InvalidOperation

from django.db import IntegrityError, transaction

OUTSTANDING = ['PENDING', 'PARTIALLY_PAID', 'OVERDUE']
ZERO = Decimal('0.00')


def parse_month(value):
    """'2026-10' -> date(2026, 10, 1). Raises ValueError for anything else."""
    try:
        year, month = (int(part) for part in str(value).split('-')[:2])
        return date(year, month, 1)
    except (TypeError, ValueError):
        raise ValueError('Month must look like YYYY-MM, e.g. 2026-10')


def month_end(month):
    return month.replace(day=calendar.monthrange(month.year, month.month)[1])


def deduction_schedule(month):
    """Rows of what each active loan should have deducted from salary this month.

    current_due is what remains of installments falling due in the month;
    arrears is what remains of installments that fell due before it.
    Loans with nothing due are left out.
    """
    from loans.models import Loan

    start, end = month, month_end(month)
    loans = (
        Loan.objects.filter(status='ACTIVE')
        .select_related('member', 'member__user')
        .prefetch_related('schedules')
        .order_by('member__member_id', 'loan_id')
    )
    rows = []
    for loan in loans:
        current = arrears = ZERO
        for installment in loan.schedules.all():
            if installment.payment_status not in OUTSTANDING:
                continue
            if installment.due_date < start:
                arrears += installment.remaining_amount
            elif installment.due_date <= end:
                current += installment.remaining_amount
        total = current + arrears
        if total <= 0:
            continue
        member = loan.member
        rows.append({
            'loan_id': loan.loan_id,
            'member_id': member.member_id,
            'member_name': member.user.get_full_name(),
            'school': member.school,
            'department': member.department,
            'current_due': current,
            'arrears': arrears,
            'amount_due': total,
        })
    return rows


def totals(rows, deducted_key=None):
    result = {
        'members': len({r['member_id'] for r in rows}),
        'current_due': sum((r['current_due'] for r in rows), ZERO),
        'arrears': sum((r['arrears'] for r in rows), ZERO),
        'amount_due': sum((r['amount_due'] for r in rows), ZERO),
    }
    if deducted_key:
        result['amount_deducted'] = sum((r[deducted_key] for r in rows), ZERO)
    return result


def _find_column(headers, *keywords):
    for index, header in enumerate(headers):
        name = header.strip().lower()
        if any(keyword in name for keyword in keywords):
            return index
    return None


def _to_amount(text):
    cleaned = str(text).replace(',', '').replace('K', '').replace('k', '').strip()
    if not cleaned:
        return ZERO
    return Decimal(cleaned).quantize(Decimal('0.01'))


def read_payroll_return(uploaded_file):
    """Read payroll's return: a CSV with a MAN number column and an amount column.

    Column names are matched loosely ('MAN Number', 'MAN No', 'Amount
    Deducted', 'Deduction', ...). Returns {man_number: total deducted}.
    """
    raw = uploaded_file.read()
    try:
        text = raw.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = raw.decode('latin-1')
    reader = csv.reader(io.StringIO(text))
    try:
        headers = next(reader)
    except StopIteration:
        raise ValueError('The file is empty')

    man_col = _find_column(headers, 'man')
    amount_col = _find_column(headers, 'deduct', 'amount')
    if man_col is None or amount_col is None:
        raise ValueError(
            'The file needs a MAN number column and an amount deducted column '
            '(download the return template to see the format)'
        )

    deducted = {}
    for line_number, row in enumerate(reader, start=2):
        if not any(cell.strip() for cell in row):
            continue
        try:
            man = row[man_col].strip()
            amount = _to_amount(row[amount_col])
        except (IndexError, InvalidOperation):
            raise ValueError(f'Line {line_number}: could not read the MAN number and amount')
        if amount < 0:
            raise ValueError(f'Line {line_number}: the amount cannot be negative')
        deducted[man] = deducted.get(man, ZERO) + amount
    return deducted


def match_return(month, deducted_by_man):
    """Compare payroll's return with the deduction list, without saving anything.

    A member's deducted amount is spread over their loans in list order.
    Each row gets a status: FULL, PARTIAL, NOT_DEDUCTED or OVER (more than
    due; only the amount due will be recorded).
    """
    rows = deduction_schedule(month)
    remaining = dict(deducted_by_man)
    for row in rows:
        available = remaining.get(row['member_id'], ZERO)
        applied = min(available, row['amount_due'])
        if row['member_id'] in remaining:
            remaining[row['member_id']] = available - applied
        row['amount_deducted'] = applied
        if applied <= 0:
            row['match'] = 'NOT_DEDUCTED'
        elif applied < row['amount_due']:
            row['match'] = 'PARTIAL'
        else:
            row['match'] = 'FULL'

    listed = {r['member_id'] for r in rows}
    for row in rows:
        if remaining.get(row['member_id'], ZERO) > 0:
            row['match'] = 'OVER'
    unknown = [
        {'member_id': man, 'amount': amount}
        for man, amount in deducted_by_man.items()
        if man not in listed
    ]
    return {
        'rows': rows,
        'unknown': unknown,
        'file_total': sum(deducted_by_man.values(), ZERO),
        'totals': totals(rows, 'amount_deducted'),
    }


@transaction.atomic
def confirm_month(month, deductions, confirmed_by, bank_amount=None, notes=''):
    """Record a month's salary deductions as repayments.

    deductions: {loan_id: amount deducted}. Loans on the list that are
    missing (or 0) were not deducted; their installments stay unpaid and
    count as arrears / overdue. Each month can only be confirmed once.
    """
    from audit.services import AuditService
    from defaulters.services import DefaulterDetectionService
    from loans.models import Loan

    from .models import PayrollDeduction, PayrollRun
    from .services import RepaymentService

    if month > date.today().replace(day=1):
        raise ValueError('You can only confirm deductions for this month or earlier months')
    if PayrollRun.objects.filter(month=month).exists():
        raise ValueError(f'Deductions for {month:%B %Y} have already been confirmed')

    rows = deduction_schedule(month)
    by_loan = {row['loan_id']: row for row in rows}
    unknown = set(deductions) - set(by_loan)
    if unknown:
        raise ValueError(f'Not on the {month:%B %Y} deduction list: {", ".join(sorted(unknown))}')

    amounts = {}
    for loan_id, row in by_loan.items():
        try:
            amount = Decimal(str(deductions.get(loan_id, 0) or 0)).quantize(Decimal('0.01'))
        except InvalidOperation:
            raise ValueError(f'{loan_id}: the amount is not a number')
        if amount < 0:
            raise ValueError(f'{loan_id}: the amount cannot be negative')
        if amount > row['amount_due']:
            raise ValueError(
                f'{loan_id}: K{amount:,.2f} is more than the K{row["amount_due"]:,.2f} due'
            )
        amounts[loan_id] = amount

    try:
        run = PayrollRun.objects.create(
            month=month,
            total_due=sum((r['amount_due'] for r in rows), ZERO),
            total_deducted=sum(amounts.values(), ZERO),
            bank_amount=bank_amount,
            notes=notes,
            confirmed_by=confirmed_by,
        )
    except IntegrityError:
        raise ValueError(f'Deductions for {month:%B %Y} have already been confirmed')

    label = f'{month:%B %Y}'
    service = RepaymentService()
    loans = {loan.loan_id: loan for loan in Loan.objects.filter(loan_id__in=by_loan)}
    for loan_id, row in by_loan.items():
        amount = amounts[loan_id]
        PayrollDeduction.objects.create(
            run=run,
            loan=loans[loan_id],
            current_due=row['current_due'],
            arrears=row['arrears'],
            amount_due=row['amount_due'],
            amount_deducted=amount,
        )
        if amount > 0:
            service.record_payment(
                loan=loans[loan_id],
                amount=amount,
                recorded_by=confirmed_by,
                notes=f'Payroll deduction, {label}',
                payment_mode='SALARY_DEDUCTION',
            )

    # Members who weren't deducted now show as overdue / defaulters
    DefaulterDetectionService().update_statuses()

    not_deducted = sum(1 for a in amounts.values() if a <= 0)
    AuditService.log_action(
        user=confirmed_by,
        action='CONFIRMED_PAYROLL_DEDUCTIONS',
        entity_type='PayrollRun',
        entity_id=run.pk,
        description=(
            f'Confirmed {label} salary deductions: K{run.total_deducted:,.2f} of '
            f'K{run.total_due:,.2f} due across {len(rows)} loans'
            + (f'; {not_deducted} not deducted' if not_deducted else '')
        ),
        new_value={
            'month': month.isoformat(),
            'total_due': str(run.total_due),
            'total_deducted': str(run.total_deducted),
            'bank_amount': str(bank_amount) if bank_amount is not None else None,
        },
    )
    return run


def confirmed_rows(run):
    """The saved rows of a confirmed month, in the same shape as the schedule."""
    rows = []
    for d in run.deductions.select_related('loan', 'loan__member', 'loan__member__user'):
        member = d.loan.member
        deducted = d.amount_deducted
        rows.append({
            'loan_id': d.loan.loan_id,
            'member_id': member.member_id,
            'member_name': member.user.get_full_name(),
            'school': member.school,
            'department': member.department,
            'current_due': d.current_due,
            'arrears': d.arrears,
            'amount_due': d.amount_due,
            'amount_deducted': deducted,
            'match': (
                'NOT_DEDUCTED' if deducted <= 0
                else 'PARTIAL' if deducted < d.amount_due
                else 'FULL'
            ),
        })
    return rows
