from decimal import Decimal

from .models import EligibilityRule, EligibilityScore


class EligibilityScoringService:
    """Single service class that orchestrates all factor scoring."""

    def calculate(self, application):
        """
        Calculate eligibility score for a loan application.

        1. Load all active EligibilityRule objects
        2. For each factor, calculate the score based on thresholds
        3. Apply weights
        4. Sum weighted scores to get total
        5. Determine recommendation based on thresholds
        6. Generate reasons
        """
        rules = EligibilityRule.objects.filter(is_active=True)
        breakdown = {}
        reasons = []

        for rule in rules:
            score = self._score_factor(rule, application)
            weighted = Decimal(str(score)) * (rule.weight / Decimal('100'))
            breakdown[rule.factor] = float(weighted)
            reasons.extend(self._generate_reasons(rule, score))

        total = sum(breakdown.values())
        total = round(total, 2)
        recommendation = self._get_recommendation(total)

        # Create or update the score
        score_obj, created = EligibilityScore.objects.update_or_create(
            application=application,
            defaults={
                'total_score': total,
                'breakdown': breakdown,
                'recommendation': recommendation,
                'reasons': reasons,
            }
        )

        return score_obj

    def _score_factor(self, rule, application):
        """Score a single factor based on its thresholds."""
        value = self._get_factor_value(rule.factor, application)

        for threshold in rule.thresholds:
            min_val = threshold.get('min', 0)
            max_val = threshold.get('max')
            score = threshold.get('score', 0)

            if max_val is None:
                # No upper bound
                if value >= min_val:
                    return score
            else:
                if min_val <= value <= max_val:
                    return score

        return 0

    def _get_factor_value(self, factor, application):
        """Extract the raw value for a factor from the application."""
        if factor == 'INCOME':
            return float(application.member.monthly_income)
        elif factor == 'EMPLOYMENT':
            return self._employment_score(application.member)
        elif factor == 'OBLIGATIONS':
            return self._obligations_score(application)
        elif factor == 'REPAYMENT_HISTORY':
            return self._repayment_history_score(application.member)
        return 0

    def _employment_score(self, member):
        """Score based on employment status."""
        employment_scores = {
            'PERMANENT': 100,
            'CONTRACT': 60,
            'PART_TIME': 30,
            'RETIRED': 10,
        }
        return employment_scores.get(member.employment_status, 0)

    def _obligations_score(self, application):
        """Score based on existing loan obligations. Higher = fewer obligations = better."""
        obligations = application.existing_loan_obligations or []
        num_obligations = len(obligations)

        # More obligations = lower score
        if num_obligations == 0:
            return 100
        elif num_obligations == 1:
            return 70
        elif num_obligations == 2:
            return 40
        else:
            return 10

    def _repayment_history_score(self, member):
        """
        Score based on repayment history.
        First-time borrowers get neutral score (50).
        """
        from loans.models import Loan

        loans = Loan.objects.filter(member=member)

        if not loans.exists():
            # First-time borrower — neutral score
            return 50

        total_paid = sum(loan.amount_repaid for loan in loans)
        total_expected = sum(loan.total_repayment for loan in loans)

        if total_expected == 0:
            return 50

        payment_ratio = float(total_paid / total_expected)

        if payment_ratio >= 0.9:
            return 100
        elif payment_ratio >= 0.7:
            return 75
        elif payment_ratio >= 0.5:
            return 50
        elif payment_ratio >= 0.3:
            return 25
        else:
            return 10

    def _generate_reasons(self, rule, score):
        """Generate human-readable reasons based on score."""
        reasons = []

        if rule.factor == 'INCOME':
            if score >= 80:
                reasons.append('✓ Good income level')
            elif score >= 50:
                reasons.append('~ Moderate income level')
            else:
                reasons.append('✗ Low income level')

        elif rule.factor == 'EMPLOYMENT':
            if score >= 80:
                reasons.append('✓ Stable employment')
            elif score >= 50:
                reasons.append('~ Moderate employment stability')
            else:
                reasons.append('✗ Unstable employment')

        elif rule.factor == 'OBLIGATIONS':
            if score >= 80:
                reasons.append('✓ No major existing obligations')
            elif score >= 50:
                reasons.append('~ Some existing obligations')
            else:
                reasons.append('✗ Multiple existing obligations')

        elif rule.factor == 'REPAYMENT_HISTORY':
            if score >= 80:
                reasons.append('✓ Good repayment history')
            elif score == 50:
                reasons.append('~ First-time borrower (neutral score)')
            elif score >= 30:
                reasons.append('✗ Poor repayment history')
            else:
                reasons.append('✗ Very poor repayment history')

        return reasons

    def _get_recommendation(self, total_score):
        """Determine recommendation based on total score."""
        if total_score >= 70:
            return 'ELIGIBLE'
        elif total_score >= 40:
            return 'REVIEW'
        return 'NOT_ELIGIBLE'
