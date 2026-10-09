import pytest
from decimal import Decimal

from loans.services import LoanApplicationService
from repayments.services import RepaymentService


@pytest.mark.django_db
class TestRepaymentService:
    """Test repayment recording service."""

    def _create_approved_loan(self, member, loan_type, admin_user, eligibility_rules):
        """Helper to create an approved loan."""
        service = LoanApplicationService()
        app = service.create_application(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('10000'),
            duration_months=6,
            purpose='Test loan',
        )
        return service.approve_application(app, admin_user)

    def test_record_full_payment(self, admin_user, member, loan_type, eligibility_rules):
        """Full payment updates installment to PAID."""
        loan = self._create_approved_loan(member, loan_type, admin_user, eligibility_rules)
        schedule = loan.schedules.first()

        service = RepaymentService()
        payments = service.record_payment(
            loan=loan,
            amount=schedule.expected_amount,
            recorded_by=admin_user,
        )

        assert len(payments) == 1
        schedule.refresh_from_db()
        assert schedule.payment_status == 'PAID'
        assert schedule.amount_paid == schedule.expected_amount

    def test_record_partial_payment(self, admin_user, member, loan_type, eligibility_rules):
        """Partial payment creates PARTIALLY_PAID status."""
        loan = self._create_approved_loan(member, loan_type, admin_user, eligibility_rules)
        schedule = loan.schedules.first()

        service = RepaymentService()
        payments = service.record_payment(
            loan=loan,
            amount=Decimal('500'),
            recorded_by=admin_user,
        )

        assert len(payments) == 1
        schedule.refresh_from_db()
        assert schedule.payment_status == 'PARTIALLY_PAID'
        assert schedule.amount_paid == Decimal('500')

    def test_reject_zero_payment(self, admin_user, member, loan_type, eligibility_rules):
        """Zero payment is rejected."""
        loan = self._create_approved_loan(member, loan_type, admin_user, eligibility_rules)

        service = RepaymentService()
        with pytest.raises(ValueError, match='greater than zero'):
            service.record_payment(
                loan=loan,
                amount=Decimal('0'),
                recorded_by=admin_user,
            )

    def test_schedule_adds_up_to_total_repayment(self, admin_user, member, loan_type, eligibility_rules):
        """Installments sum exactly to total_repayment despite cent rounding."""
        loan = self._create_approved_loan(member, loan_type, admin_user, eligibility_rules)
        total = sum(s.expected_amount for s in loan.schedules.all())
        assert total == loan.total_repayment

    def test_paying_every_installment_completes_loan(self, admin_user, member, loan_type, eligibility_rules):
        """Paying each installment as scheduled closes the loan with zero balance."""
        loan = self._create_approved_loan(member, loan_type, admin_user, eligibility_rules)
        service = RepaymentService()
        for schedule in loan.schedules.order_by('installment_number'):
            service.record_payment(
                loan=loan, amount=schedule.expected_amount, recorded_by=admin_user,
            )
        loan.refresh_from_db()
        assert loan.outstanding_balance == Decimal('0')
        assert loan.status == 'COMPLETED'

    def test_paying_overdue_installment_clears_defaulter_status(
        self, admin_user, member, loan_type, eligibility_rules
    ):
        """A member who pays their overdue installment is no longer a defaulter."""
        from datetime import date, timedelta
        from defaulters.models import DefaulterStatus

        loan = self._create_approved_loan(member, loan_type, admin_user, eligibility_rules)
        schedule = loan.schedules.order_by('installment_number').first()
        schedule.due_date = date.today() - timedelta(days=45)
        schedule.save()
        DefaulterStatus.objects.create(
            member=member, loan=loan, schedule=schedule,
            days_overdue=45, classification='DEFAULTER',
        )

        RepaymentService().record_payment(
            loan=loan, amount=schedule.remaining_amount, recorded_by=admin_user,
        )

        status = DefaulterStatus.objects.get(schedule=schedule)
        assert status.classification == 'CURRENT'
        assert status.days_overdue == 0

    def test_reject_payment_on_completed_loan(self, admin_user, member, loan_type, eligibility_rules):
        """Payment on completed loan is rejected."""
        loan = self._create_approved_loan(member, loan_type, admin_user, eligibility_rules)
        loan.status = 'COMPLETED'
        loan.save()

        service = RepaymentService()
        with pytest.raises(ValueError, match='not active'):
            service.record_payment(
                loan=loan,
                amount=Decimal('1000'),
                recorded_by=admin_user,
            )
