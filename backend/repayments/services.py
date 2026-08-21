import uuid
from datetime import date, timedelta
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from loans.models import Loan
from loans.services import LoanCalculationService


class RepaymentScheduleService:
    """Generates repayment schedules for approved loans."""

    def generate_schedule(self, loan):
        """Generate repayment schedule installments for a loan."""
        from .models import RepaymentSchedule

        calc_service = LoanCalculationService()
        start_date = date.today()
        due_dates = calc_service.generate_installment_dates(start_date, loan.duration_months)

        schedules = []
        for i, due_date in enumerate(due_dates, start=1):
            schedule = RepaymentSchedule(
                loan=loan,
                installment_number=i,
                due_date=due_date,
                expected_amount=loan.monthly_installment,
                remaining_amount=loan.monthly_installment,
                payment_status='PENDING',
                days_overdue=0,
            )
            schedules.append(schedule)

        # bulk_create bypasses save(), so generate installment_id before insert
        for schedule in schedules:
            if not schedule.installment_id:
                schedule.installment_id = f'INS-{uuid.uuid4().hex[:8].upper()}'

        RepaymentSchedule.objects.bulk_create(schedules)
        return schedules


class RepaymentService:
    """Handles repayment recording and balance updates."""

    @transaction.atomic
    def record_payment(self, loan, amount, recorded_by, schedule_id=None, notes=''):
        """
        Record a repayment against a loan.

        1. Validate loan is active
        2. Validate payment amount > 0
        3. If schedule_id provided, apply to specific installment
        4. Otherwise, apply to oldest outstanding installment(s)
        5. Handle partial payments
        6. Handle overpayment
        7. Update installment status
        8. Update loan balance
        9. If fully repaid, mark loan as COMPLETED
        10. Create audit log entry
        """
        from .models import Repayment, RepaymentSchedule

        # Validate loan
        if loan.status != 'ACTIVE':
            raise ValueError('Loan is not active')

        # Validate amount
        if amount <= 0:
            raise ValueError('Payment amount must be greater than zero')

        # Get outstanding installments
        outstanding = RepaymentSchedule.objects.filter(
            loan=loan,
            payment_status__in=['PENDING', 'PARTIALLY_PAID', 'OVERDUE']
        ).order_by('installment_number')

        if not outstanding.exists():
            raise ValueError('No outstanding installments for this loan')

        remaining_payment = Decimal(str(amount))
        payments_created = []

        for schedule in outstanding:
            if remaining_payment <= 0:
                break

            installment_remaining = Decimal(str(schedule.remaining_amount))
            payment_for_installment = min(remaining_payment, installment_remaining)

            # Create repayment record
            repayment = Repayment.objects.create(
                loan=loan,
                schedule=schedule,
                amount=payment_for_installment,
                recorded_by=recorded_by,
                notes=notes,
            )
            payments_created.append(repayment)

            # Update schedule
            schedule.amount_paid += payment_for_installment
            schedule.remaining_amount -= payment_for_installment

            if schedule.remaining_amount <= 0:
                schedule.payment_status = 'PAID'
                schedule.remaining_amount = Decimal('0')
            else:
                schedule.payment_status = 'PARTIALLY_PAID'

            schedule.save()

            remaining_payment -= payment_for_installment

        # Update loan
        loan.amount_repaid += Decimal(str(amount))
        loan.outstanding_balance -= Decimal(str(amount))

        if loan.outstanding_balance <= 0:
            loan.outstanding_balance = Decimal('0')
            loan.status = 'COMPLETED'

        loan.save()

        # Update defaulter status
        from defaulters.services import DefaulterDetectionService
        defaulter_service = DefaulterDetectionService()
        defaulter_service.update_loan_status(loan)

        # Create audit log
        from audit.services import AuditService
        AuditService.log_action(
            user=recorded_by,
            action='RECORDED_REPAYMENT',
            entity_type='Loan',
            entity_id=str(loan.loan_id),
            description=f'Recorded payment of K{amount} for loan {loan.loan_id}',
            new_value={'amount': str(amount), 'loan_id': loan.loan_id},
        )

        return payments_created

    def get_outstanding_installments(self, loan):
        """Get all outstanding installments for a loan."""
        from .models import RepaymentSchedule

        return RepaymentSchedule.objects.filter(
            loan=loan,
            payment_status__in=['PENDING', 'PARTIALLY_PAID', 'OVERDUE']
        ).order_by('installment_number')

    def get_next_payment(self, loan):
        """Get the next upcoming payment for a loan."""
        from .models import RepaymentSchedule

        return RepaymentSchedule.objects.filter(
            loan=loan,
            payment_status__in=['PENDING', 'PARTIALLY_PAID']
        ).order_by('due_date').first()
