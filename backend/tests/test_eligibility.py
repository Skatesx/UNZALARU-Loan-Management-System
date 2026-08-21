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

    def test_high_income_scores_high(self, member, loan_type, eligibility_rules):
        """Member with high income scores higher on income factor."""
        member.monthly_income = Decimal('20000')
        member.save()

        app = LoanApplication.objects.create(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('10000'),
            duration_months=6,
            purpose='Test',
        )
        service = EligibilityScoringService()
        score = service.calculate(app)

        assert 'INCOME' in score.breakdown
        assert score.breakdown['INCOME'] > 20  # 30% weight * high score

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
        member.monthly_income = Decimal('25000')
        member.save()

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
