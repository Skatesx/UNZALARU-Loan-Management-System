import pytest
from decimal import Decimal

from eligibility.models import EligibilityScore
from eligibility.services import EligibilityScoringService
from loans.models import LoanApplication


@pytest.mark.django_db
class TestEligibilityScoring:
    """Test eligibility scoring service."""

    def test_calculate_score(self, member, loan_type, eligibility_rules):
        """Eligibility score can be calculated."""
        app = LoanApplication.objects.create(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('10000'),
            duration_months=6,
            purpose='Test',
            current_employment_info={},
            income_info={},
            existing_loan_obligations=[],
        )
        service = EligibilityScoringService()
        score = service.calculate(app)

        assert score is not None
        assert score.total_score >= 0
        assert score.total_score <= 100
        assert score.recommendation in ['ELIGIBLE', 'REVIEW', 'NOT_ELIGIBLE']

    def test_first_time_applicant_scores_highest(self, member, loan_type, eligibility_rules):
        """A member's first application gets the full application-history score."""
        app = LoanApplication.objects.create(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('10000'),
            duration_months=6,
            purpose='Test',
        )
        score = EligibilityScoringService().calculate(app)

        assert score.breakdown['APPLICATION_HISTORY'] == 30.0  # 100 * 0.30
        assert '✓ First-time applicant (priority)' in score.reasons

    def test_repeat_applicant_scores_lower(self, member, loan_type, eligibility_rules):
        """Each earlier (non-cancelled) application lowers the score."""
        for status in ['REJECTED', 'CANCELLED', 'APPROVED']:
            LoanApplication.objects.create(
                member=member, loan_type=loan_type,
                requested_amount=Decimal('5000'), duration_months=6,
                purpose='Earlier', status=status,
            )
        app = LoanApplication.objects.create(
            member=member, loan_type=loan_type,
            requested_amount=Decimal('10000'), duration_months=6, purpose='Test',
        )
        assert app.previous_applications == 2  # the cancelled one doesn't count
        score = EligibilityScoringService().calculate(app)

        assert score.breakdown['APPLICATION_HISTORY'] == 12.0  # 40 * 0.30

    def test_first_time_borrower_neutral_score(self, member, loan_type, eligibility_rules):
        """First-time borrower gets neutral repayment score."""
        app = LoanApplication.objects.create(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('10000'),
            duration_months=6,
            purpose='Test',
        )
        service = EligibilityScoringService()
        score = service.calculate(app)

        # First-time borrowers get 50/100 for repayment history
        # With 20% weight, that's 10 points
        assert 'REPAYMENT_HISTORY' in score.breakdown
        assert score.breakdown['REPAYMENT_HISTORY'] == 10.0  # 50 * 0.20

    def test_existing_obligations_reduce_score(self, member, loan_type, eligibility_rules):
        """Existing obligations reduce eligibility score."""
        app = LoanApplication.objects.create(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('10000'),
            duration_months=6,
            purpose='Test',
            existing_loan_obligations=[
                {'amount': 5000, 'lender': 'Bank A'},
                {'amount': 3000, 'lender': 'Bank B'},
            ],
        )
        service = EligibilityScoringService()
        score = service.calculate(app)

        # 2 obligations = score 20, weight 25% = 5 points
        assert 'OBLIGATIONS' in score.breakdown
        assert score.breakdown['OBLIGATIONS'] == 5.0  # 20 * 0.25

    def test_eligible_recommendation(self, member, loan_type, eligibility_rules):
        """High-scoring application gets ELIGIBLE recommendation."""
        app = LoanApplication.objects.create(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('10000'),
            duration_months=6,
            purpose='Test',
            existing_loan_obligations=[],
        )
        service = EligibilityScoringService()
        score = service.calculate(app)

        assert score.total_score >= 70
        assert score.recommendation == 'ELIGIBLE'

    def test_reasons_generated(self, member, loan_type, eligibility_rules):
        """Reasons are generated for each factor."""
        app = LoanApplication.objects.create(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('10000'),
            duration_months=6,
            purpose='Test',
        )
        service = EligibilityScoringService()
        score = service.calculate(app)

        assert len(score.reasons) >= 4  # One reason per factor


# Same bands as the demo data in load_seed_data: obligations and earlier
# applications are counts, repayment history is the percentage of due
# installments paid.
SEED_RULES = [
    ('APPLICATION_HISTORY', 30, [
        {'min': 0, 'max': 0, 'score': 100}, {'min': 1, 'max': 1, 'score': 70},
        {'min': 2, 'max': 2, 'score': 40}, {'min': 3, 'max': None, 'score': 10}]),
    ('EMPLOYMENT', 25, [
        {'min': 0, 'max': 30, 'score': 30}, {'min': 31, 'max': 60, 'score': 60},
        {'min': 61, 'max': 100, 'score': 100}]),
    ('OBLIGATIONS', 25, [
        {'min': 0, 'max': 0, 'score': 100}, {'min': 1, 'max': 1, 'score': 70},
        {'min': 2, 'max': 2, 'score': 40}, {'min': 3, 'max': 100, 'score': 10}]),
    ('REPAYMENT_HISTORY', 20, [
        {'min': 0, 'max': 25, 'score': 10}, {'min': 26, 'max': 50, 'score': 30},
        {'min': 51, 'max': 75, 'score': 60}, {'min': 76, 'max': 100, 'score': 100}]),
]


@pytest.fixture
def seed_rules(db):
    from eligibility.models import EligibilityRule

    return [
        EligibilityRule.objects.create(
            name=factor.title(), factor=factor, weight=Decimal(weight), thresholds=bands)
        for factor, weight, bands in SEED_RULES
    ]


def _application(member, loan_type, obligations=()):
    return LoanApplication.objects.create(
        member=member, loan_type=loan_type, requested_amount=Decimal('10000'),
        duration_months=6, purpose='Test', existing_loan_obligations=list(obligations),
    )


@pytest.mark.django_db
class TestFactorValues:
    """Factor values are raw counts and percentages, matched against the bands."""

    def test_no_obligations_get_full_obligations_score(self, member, loan_type, seed_rules):
        score = EligibilityScoringService().calculate(_application(member, loan_type))

        assert score.breakdown['OBLIGATIONS'] == 25.0  # 100 * 0.25
        assert '✓ No major existing obligations' in score.reasons

    def test_three_obligations_get_lowest_band(self, member, loan_type, seed_rules):
        app = _application(member, loan_type, obligations=[{}, {}, {}])
        score = EligibilityScoringService().calculate(app)

        assert score.breakdown['OBLIGATIONS'] == 2.5  # 10 * 0.25

    def test_first_time_applicant_can_be_eligible(self, member, loan_type, seed_rules):
        """A permanent employee applying for the first time, with no obligations."""
        score = EligibilityScoringService().calculate(_application(member, loan_type))

        # 30 history + 25 employment + 25 obligations + 12 neutral repayment
        assert float(score.total_score) == 92.0
        assert score.recommendation == 'ELIGIBLE'
        assert '~ First-time borrower (neutral score)' in score.reasons

    @pytest.mark.parametrize('paid, expected', [(2, 20.0), (1, 6.0), (0, 2.0)])
    def test_repayment_history_uses_share_of_due_installments_paid(
            self, member, loan_type, admin_user, seed_rules, paid, expected):
        from datetime import date, timedelta

        from loans.services import LoanApplicationService

        service = LoanApplicationService()
        app = service.create_application(
            member=member, loan_type=loan_type, requested_amount=Decimal('10000'),
            duration_months=6, purpose='First loan')
        loan = service.approve_application(app, admin_user)
        # Two installments have fallen due; `paid` of them were paid
        for i, schedule in enumerate(loan.schedules.order_by('installment_number')[:2]):
            schedule.due_date = date.today() - timedelta(days=60 - i * 30)
            schedule.payment_status = 'PAID' if i < paid else 'OVERDUE'
            schedule.save()

        score = EligibilityScoringService().calculate(_application(member, loan_type))

        # 100% -> 100, 50% -> 30, 0% -> 10, each weighted by 20%
        assert score.breakdown['REPAYMENT_HISTORY'] == expected
