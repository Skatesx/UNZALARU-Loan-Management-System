"""Tests for configurable loan approval criteria and payment modes."""
import pytest
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone

from config_app.models import SystemConfig
from loans.criteria import CRITERIA_KEY, DEFAULT_CRITERIA, evaluate, get_criteria
from loans.models import LoanApplication
from loans.services import LoanApplicationService
from repayments.models import Repayment, RepaymentSchedule


def make_application(member, loan_type, amount=Decimal('10000'), months=6):
    return LoanApplication.objects.create(
        member=member,
        loan_type=loan_type,
        requested_amount=amount,
        duration_months=months,
        purpose='Test loan',
    )


@pytest.mark.django_db
class TestApprovalCriteria:
    """Test configurable loan approval criteria."""

    def test_criteria_defaults_load(self, db):
        criteria = get_criteria()
        for key in DEFAULT_CRITERIA:
            assert key in criteria

    def test_good_member_passes_criteria(self, member, loan_type, eligibility_rules):
        member.verified_income = Decimal('10000')
        member.save()
        app = make_application(member, loan_type)
        result = evaluate(app)
        assert result['passed'] is True
        assert all(r['passed'] for r in result['results'])

    def test_low_score_fails_criteria(self, member, loan_type, eligibility_rules):
        member.monthly_income = Decimal('1500')
        member.verified_income = Decimal('1500')
        member.save()
        app = make_application(member, loan_type)
        result = evaluate(app)
        assert result['passed'] is False
        failed_keys = [r['key'] for r in result['results'] if not r['passed']]
        assert 'min_eligibility_score' in failed_keys

    def test_unverified_income_fails_criteria(
        self, member, loan_type, eligibility_rules
    ):
        member.income_verified = False
        member.verified_income = None
        member.save()
        app = make_application(member, loan_type)
        result = evaluate(app)
        failed_keys = [r['key'] for r in result['results'] if not r['passed']]
        assert 'require_income_verification' in failed_keys

    def test_high_installment_ratio_fails(
        self, member, loan_type, eligibility_rules
    ):
        # Tiny income relative to requested amount
        member.monthly_income = Decimal('1000')
        member.verified_income = Decimal('1000')
        member.save()
        app = make_application(member, loan_type, amount=Decimal('20000'))
        result = evaluate(app)
        failed_keys = [r['key'] for r in result['results'] if not r['passed']]
        assert 'max_installment_income_ratio' in failed_keys

    def test_pending_member_fails_membership_criterion(
        self, member, loan_type, eligibility_rules
    ):
        member.membership_status = 'PENDING'
        member.save()
        app = make_application(member, loan_type)
        result = evaluate(app)
        failed_keys = [r['key'] for r in result['results'] if not r['passed']]
        assert 'require_active_membership' in failed_keys

    def test_defaulter_fails_criteria(
        self, member, loan_type, eligibility_rules
    ):
        from defaulters.models import DefaulterStatus
        from loans.models import Loan

        app = make_application(member, loan_type)
        # Give the member an active loan with a severe overdue installment
        loan = Loan.objects.create(
            application=app,
            member=member,
            loan_type=loan_type,
            principal=Decimal('5000'),
            interest_rate=Decimal('12'),
            interest_method='FLAT',
            total_interest=Decimal('600'),
            total_repayment=Decimal('5600'),
            duration_months=6,
            monthly_installment=Decimal('933.33'),
            outstanding_balance=Decimal('5600'),
        )
        schedule = RepaymentSchedule.objects.create(
            loan=loan,
            installment_number=1,
            due_date=timezone.now().date() - timedelta(days=90),
            expected_amount=Decimal('933.33'),
            remaining_amount=Decimal('933.33'),
            payment_status='OVERDUE',
            days_overdue=90,
        )
        DefaulterStatus.objects.create(
            member=member,
            loan=loan,
            schedule=schedule,
            days_overdue=90,
            classification='SEVERE_DEFAULTER',
        )
        result = evaluate(app)
        failed_keys = [r['key'] for r in result['results'] if not r['passed']]
        assert 'reject_if_defaulter' in failed_keys
        assert 'reject_if_any_overdue' in failed_keys

    def test_criteria_configurable_via_system_config(
        self, member, loan_type, eligibility_rules, db
    ):
        # Lower score threshold and disable verification via SystemConfig
        custom = dict(DEFAULT_CRITERIA)
        custom['min_eligibility_score'] = 0
        custom['require_income_verification'] = False
        custom['max_installment_income_ratio'] = 10
        SystemConfig.objects.update_or_create(
            key=CRITERIA_KEY, defaults={'value': custom}
        )

        member.monthly_income = Decimal('1000')
        member.verified_income = None
        member.income_verified = False
        member.save()

        app = make_application(member, loan_type)
        result = evaluate(app)
        # All criteria should now pass
        assert result['passed'] is True

    def test_approve_blocked_without_override(
        self, member, loan_type, eligibility_rules
    ):
        member.income_verified = False
        member.verified_income = None
        member.save()
        app = make_application(member, loan_type)

        service = LoanApplicationService()
        with pytest.raises(ValueError, match='criteria not met'):
            service.approve_application(app, None)

    def test_approve_with_override_succeeds(
        self, admin_user, member, loan_type, eligibility_rules
    ):
        member.income_verified = False
        member.verified_income = None
        member.save()
        app = make_application(member, loan_type)

        service = LoanApplicationService()
        loan = service.approve_application(
            app, admin_user, override_reason='Chairperson approved exception'
        )
        assert loan is not None
        assert loan.status == 'ACTIVE'
        assert app.status == 'APPROVED'
        assert (
            app.income_info.get('criteria_override_reason')
            == 'Chairperson approved exception'
        )


@pytest.mark.django_db
class TestPaymentModes:
    """Test repayment recording with payment modes."""

    def _create_loan(self, admin_user, member, loan_type, eligibility_rules):
        service = LoanApplicationService()
        app = service.create_application(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('6000'),
            duration_months=6,
            purpose='Test',
        )
        return service.approve_application(app, admin_user)

    def test_payment_mode_recorded(
        self, admin_user, member, loan_type, eligibility_rules
    ):
        loan = self._create_loan(admin_user, member, loan_type, eligibility_rules)
        from repayments.services import RepaymentService

        payments = RepaymentService().record_payment(
            loan=loan,
            amount=Decimal('500'),
            recorded_by=admin_user,
            payment_mode='MOBILE_MONEY',
        )
        assert payments[0].payment_mode == 'MOBILE_MONEY'

    def test_overpayment_capped(
        self, admin_user, member, loan_type, eligibility_rules
    ):
        loan = self._create_loan(admin_user, member, loan_type, eligibility_rules)
        from repayments.services import RepaymentService

        # Pay far more than outstanding
        RepaymentService().record_payment(
            loan=loan,
            amount=Decimal('999999'),
            recorded_by=admin_user,
            payment_mode='BANK_TRANSFER',
        )
        loan.refresh_from_db()
        assert loan.outstanding_balance == Decimal('0')
        assert loan.status == 'COMPLETED'
        assert loan.amount_repaid == loan.total_repayment
