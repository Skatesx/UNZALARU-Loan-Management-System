"""Monthly salary deductions: the list for payroll, the return, and confirming a month."""
from datetime import date, timedelta
from decimal import Decimal
from io import BytesIO

import pytest
from rest_framework import status

from audit.models import AuditLog
from defaulters.models import DefaulterStatus
from loans.models import Loan, LoanApplication
from repayments.models import PayrollRun, Repayment, RepaymentSchedule
from repayments.payroll import (
    confirm_month,
    deduction_schedule,
    match_return,
    read_payroll_return,
)

THIS_MONTH = date.today().replace(day=1)
LAST_MONTH = (THIS_MONTH - timedelta(days=1)).replace(day=1)


def make_loan(member, loan_type, installments):
    """An active loan with installments [(due_date, amount)]."""
    app = LoanApplication.objects.create(
        member=member, loan_type=loan_type, requested_amount=Decimal('10000'),
        duration_months=len(installments), purpose='Test', status='APPROVED',
    )
    total = sum(a for _, a in installments)
    loan = Loan.objects.create(
        application=app, member=member, loan_type=loan_type,
        principal=Decimal('10000'), interest_rate=Decimal('10'), interest_method='FLAT_ONCE',
        total_interest=total - Decimal('10000'), total_repayment=total,
        duration_months=len(installments), monthly_installment=installments[0][1],
        outstanding_balance=total,
    )
    for number, (due, amount) in enumerate(installments, start=1):
        RepaymentSchedule.objects.create(
            loan=loan, installment_number=number, due_date=due,
            expected_amount=amount, remaining_amount=amount,
        )
    return loan


@pytest.fixture
def loans(member, pending_member, loan_type):
    """member: one missed installment last month + one due this month.
    pending_member (made active): one installment due this month."""
    pending_member.membership_status = 'ACTIVE'
    pending_member.save()
    first = make_loan(member, loan_type, [
        (LAST_MONTH + timedelta(days=9), Decimal('3000')),
        (THIS_MONTH + timedelta(days=9), Decimal('3000')),
        (THIS_MONTH + timedelta(days=40), Decimal('5000')),
    ])
    second = make_loan(pending_member, loan_type, [
        (THIS_MONTH + timedelta(days=14), Decimal('2750')),
        (THIS_MONTH + timedelta(days=44), Decimal('2750')),
    ])
    return first, second


def as_file(text):
    upload = BytesIO(text.encode())
    upload.name = 'return.csv'
    return upload


@pytest.mark.django_db
class TestDeductionList:
    def test_current_installment_plus_arrears(self, loans):
        first, second = loans
        rows = {r['loan_id']: r for r in deduction_schedule(THIS_MONTH)}
        assert rows[first.loan_id]['current_due'] == Decimal('3000')
        assert rows[first.loan_id]['arrears'] == Decimal('3000')
        assert rows[first.loan_id]['amount_due'] == Decimal('6000')
        assert rows[second.loan_id]['amount_due'] == Decimal('2750')

    def test_paid_installments_are_left_out(self, loans):
        first, _ = loans
        installment = first.schedules.get(installment_number=1)
        installment.payment_status, installment.remaining_amount = 'PAID', Decimal('0')
        installment.save()
        row = next(r for r in deduction_schedule(THIS_MONTH) if r['loan_id'] == first.loan_id)
        assert row['arrears'] == Decimal('0')

    def test_list_endpoint_and_exports(self, auth_client_admin, loans, member):
        month = THIS_MONTH.strftime('%Y-%m')
        data = auth_client_admin.get('/api/payroll/deductions/', {'month': month}).json()
        assert data['confirmed'] is False
        assert data['totals']['amount_due'] == '8750.00'

        csv_body = auth_client_admin.get(
            '/api/payroll/deductions/export/csv/', {'month': month}
        ).content.decode()
        assert 'MAN Number' in csv_body and 'Arrears' in csv_body and member.member_id in csv_body

        template = auth_client_admin.get(
            '/api/payroll/deductions/export/template/', {'month': month}
        ).content.decode()
        assert template.splitlines()[0] == 'MAN Number,Name,Amount Deducted'
        assert f'{member.member_id},Member User,6000.00' in template

    def test_bad_month(self, auth_client_admin):
        response = auth_client_admin.get('/api/payroll/deductions/', {'month': 'October'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPayrollReturn:
    def test_matches_full_partial_missing_and_unknown(self, loans, member, pending_member):
        first, second = loans
        deducted = read_payroll_return(as_file(
            'MAN No,Name,Deduction\n'
            f'{member.member_id},Member User,"4,000.00"\n'
            '999999,Somebody Else,500\n'
        ))
        result = match_return(THIS_MONTH, deducted)
        rows = {r['loan_id']: r for r in result['rows']}
        assert rows[first.loan_id]['match'] == 'PARTIAL'
        assert rows[first.loan_id]['amount_deducted'] == Decimal('4000')
        assert rows[second.loan_id]['match'] == 'NOT_DEDUCTED'
        assert result['unknown'] == [{'member_id': '999999', 'amount': Decimal('500.00')}]
        assert result['file_total'] == Decimal('4500.00')

    def test_file_needs_man_and_amount_columns(self):
        with pytest.raises(ValueError, match='MAN number column'):
            read_payroll_return(as_file('Name,Total\nA,1\n'))

    def test_upload_endpoint(self, auth_client_admin, loans, member):
        upload = as_file(f'MAN Number,Amount Deducted\n{member.member_id},6000\n')
        response = auth_client_admin.post(
            '/api/payroll/deductions/match/',
            {'month': THIS_MONTH.strftime('%Y-%m'), 'file': upload}, format='multipart',
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['totals']['amount_deducted'] == '6000.00'


@pytest.mark.django_db
class TestConfirmMonth:
    def test_records_salary_deductions(self, admin_user, loans):
        first, second = loans
        run = confirm_month(THIS_MONTH, {first.loan_id: '6000', second.loan_id: '0'}, admin_user,
                            bank_amount=Decimal('6000'))
        assert run.total_due == Decimal('8750') and run.total_deducted == Decimal('6000')

        first.refresh_from_db()
        assert first.amount_repaid == Decimal('6000')
        assert set(Repayment.objects.filter(loan=first).values_list('payment_mode', flat=True)) == {'SALARY_DEDUCTION'}
        assert not Repayment.objects.filter(loan=second).exists()
        assert AuditLog.objects.filter(action='CONFIRMED_PAYROLL_DEDUCTIONS').count() == 1

    def test_partial_deduction_leaves_arrears(self, admin_user, loans):
        first, _ = loans
        confirm_month(THIS_MONTH, {first.loan_id: '4000'}, admin_user)
        # Oldest installment paid first: last month's 3000 then 1000 of this month's
        assert first.schedules.get(installment_number=1).payment_status == 'PAID'
        assert first.schedules.get(installment_number=2).remaining_amount == Decimal('2000')

    def test_missed_member_becomes_overdue(self, admin_user, loans):
        first, _ = loans
        confirm_month(THIS_MONTH, {}, admin_user)
        missed = first.schedules.get(installment_number=1)
        assert DefaulterStatus.objects.get(schedule=missed).classification != 'CURRENT'

    def test_month_can_only_be_confirmed_once(self, admin_user, loans):
        confirm_month(THIS_MONTH, {}, admin_user)
        with pytest.raises(ValueError, match='already been confirmed'):
            confirm_month(THIS_MONTH, {}, admin_user)

    def test_cannot_deduct_more_than_due(self, admin_user, loans):
        first, _ = loans
        with pytest.raises(ValueError, match='more than the K6,000.00 due'):
            confirm_month(THIS_MONTH, {first.loan_id: '6000.01'}, admin_user)
        assert not PayrollRun.objects.exists()

    def test_future_month_rejected(self, admin_user, loans):
        next_month = (THIS_MONTH + timedelta(days=32)).replace(day=1)
        with pytest.raises(ValueError, match='this month or earlier'):
            confirm_month(next_month, {}, admin_user)

    def test_confirm_endpoint_and_confirmed_view(self, auth_client_admin, loans):
        first, second = loans
        month = THIS_MONTH.strftime('%Y-%m')
        response = auth_client_admin.post('/api/payroll/deductions/confirm/', {
            'month': month,
            'deductions': [
                {'loan_id': first.loan_id, 'amount_deducted': '6000'},
                {'loan_id': second.loan_id, 'amount_deducted': '2750'},
            ],
            'bank_amount': '8750',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        view = auth_client_admin.get('/api/payroll/deductions/', {'month': month}).json()
        assert view['confirmed'] is True
        assert view['run']['bank_amount'] == '8750.00'
        assert {r['match'] for r in view['rows']} == {'FULL'}

    def test_members_and_supervisors_cannot_confirm(self, auth_client_member, member, loans):
        response = auth_client_member.post('/api/payroll/deductions/confirm/', {
            'month': THIS_MONTH.strftime('%Y-%m'), 'deductions': [],
        }, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
