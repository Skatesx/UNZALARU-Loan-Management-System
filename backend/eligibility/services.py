from decimal import Decimal

from .models import EligibilityRule, EligibilityScore

# Repayment-history value for members with no installments due yet: the middle
# of the 0-100 range, so first-time borrowers get a neutral score
NEUTRAL_REPAYMENT_PERCENT = 60


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
            reasons.extend(self._generate_reasons(rule, score, application))

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
        """Extract the raw value for a factor from the application.

        Each rule's thresholds are written against these raw values: a count
        of earlier applications, an employment rating (0-100), a count of
        existing obligations, and the percentage of due installments paid.
        """
        if factor == 'APPLICATION_HISTORY':
            # Earlier applications by the member; 0 = first-time applicant,
            # who gets priority (scored highest by the default thresholds).
            return application.previous_applications
        elif factor == 'EMPLOYMENT':
            return self._employment_score(application.member)
        elif factor == 'OBLIGATIONS':
            return len(application.existing_loan_obligations or [])
        elif factor == 'REPAYMENT_HISTORY':
            return self._repayment_history_percent(application.member)
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

    def _due_installments(self, member):
        from django.utils import timezone

        from repayments.models import RepaymentSchedule

        return RepaymentSchedule.objects.filter(
            loan__member=member, due_date__lte=timezone.localdate()
        )

    def _repayment_history_percent(self, member):
        """Percentage (0-100) of the member's due installments that are paid.

        Members with nothing due yet (first-time borrowers) get a neutral
        value in the middle of the range, so they are neither rewarded nor
        penalised.
        """
        due = self._due_installments(member)
        total = due.count()
        if total == 0:
            return NEUTRAL_REPAYMENT_PERCENT
        paid = due.filter(payment_status='PAID').count()
        return paid * 100 // total

    def _generate_reasons(self, rule, score, application):
        """Generate human-readable reasons based on score."""
        reasons = []

        if rule.factor == 'APPLICATION_HISTORY':
            if score >= 80:
                reasons.append('✓ First-time applicant (priority)')
            elif score >= 50:
                reasons.append('~ Has applied for a loan once before')
            else:
                reasons.append('✗ Has applied for loans several times before')

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
            if not self._due_installments(application.member).exists():
                reasons.append('~ First-time borrower (neutral score)')
            elif score >= 80:
                reasons.append('✓ Good repayment history')
            elif score >= 50:
                reasons.append('~ Fair repayment history')
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
