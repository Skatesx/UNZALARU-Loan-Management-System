"""Configurable loan approval criteria.

All thresholds are stored in the SystemConfig table (key: 'loan_approval_criteria')
so administrators can tune them at runtime from the System Settings page.
The admin's final decision always supersedes the criteria result — criteria
serve as guardrails and recommendations, and every override is audit-logged.
"""

from decimal import Decimal

from config_app.models import SystemConfig

DEFAULT_CRITERIA = {
    # Application must have at least this eligibility score (0-100).
    'min_eligibility_score': 60,
    # Installment must not exceed this share of monthly income (0-1).
    'max_installment_income_ratio': 0.5,
    # Maximum number of simultaneously ACTIVE loans allowed per member.
    'max_active_loans': 1,
    # Member must have income verified by an administrator.
    'require_income_verification': True,
    # Member must not have overdue installments on other loans.
    'reject_if_any_overdue': True,
    # Member must not currently be classified DEFAULTER / SEVERE_DEFAULTER.
    'reject_if_defaulter': True,
    # Membership must be ACTIVE (pending members cannot borrow).
    'require_active_membership': True,
    # Minimum months of membership before borrowing (0 disables).
    'min_membership_days': 0,
}

CRITERIA_KEY = 'loan_approval_criteria'


def get_criteria():
    """Load criteria from SystemConfig, merged over defaults."""
    stored = SystemConfig.get_value(CRITERIA_KEY) or {}
    criteria = dict(DEFAULT_CRITERIA)
    for key, value in stored.items():
        if key in criteria:
            criteria[key] = value
    return criteria


def _worst_defaulter_classification(member):
    """Return the worst defaulter classification for a member, or None."""
    from defaulters.models import DefaulterStatus

    order = ['CURRENT', 'AT_RISK', 'DEFAULTER', 'SEVERE_DEFAULTER']
    worst_idx = -1
    worst = None
    current = DefaulterStatus.objects.filter(
        member=member,
        loan__status='ACTIVE',
        schedule__payment_status__in=['PENDING', 'PARTIALLY_PAID', 'OVERDUE'],
    )
    for status in current:
        idx = order.index(status.classification)
        if idx > worst_idx:
            worst_idx = idx
            worst = status.classification
    return worst


def evaluate(application):
    """Evaluate all approval criteria for a loan application.

    Returns a dict:
        passed: bool — True only if every criterion passes
        results: list of {key, label, passed, value, threshold, detail}
    """
    from defaulters.models import DefaulterStatus
    from loans.models import Loan

    member = application.member
    criteria = get_criteria()
    results = []

    def add(key, label, passed, value, threshold, detail=''):
        results.append({
            'key': key,
            'label': label,
            'passed': bool(passed),
            'value': value,
            'threshold': threshold,
            'detail': detail,
        })

    # 1. Eligibility score (computed on the fly if not yet assessed)
    min_score = criteria['min_eligibility_score']
    score_obj = getattr(application, 'eligibility', None)
    if score_obj is None:
        from eligibility.services import EligibilityScoringService
        score_obj = EligibilityScoringService().calculate(application)
    score = float(score_obj.total_score) if score_obj else None
    add(
        'min_eligibility_score',
        'Eligibility score at or above threshold',
        score is not None and score >= min_score,
        score,
        min_score,
        'Score is calculated automatically from configured rules',
    )

    # 2. Installment-to-income ratio (affordability)
    ratio_max = float(criteria['max_installment_income_ratio'])
    income = float(member.effective_income or 0)
    loan_type = application.loan_type
    if income > 0:
        if loan_type.interest_method == 'FLAT':
            interest = (
                Decimal(str(application.requested_amount))
                * (loan_type.interest_rate / Decimal('100'))
                * (Decimal(str(application.duration_months)) / Decimal('12'))
            )
        else:
            from loans.services import LoanCalculationService
            interest = LoanCalculationService.calculate_reducing_balance_interest(
                application.requested_amount,
                loan_type.interest_rate,
                application.duration_months,
            )
        total = Decimal(str(application.requested_amount)) + interest
        installment = float(total / Decimal(str(application.duration_months)))
        ratio = installment / income
    else:
        installment = 0
        ratio = float('inf')
    add(
        'max_installment_income_ratio',
        'Monthly installment within income limit',
        ratio <= ratio_max,
        round(ratio, 4) if ratio != float('inf') else None,
        ratio_max,
        f'Estimated installment K{installment:,.2f} vs income K{income:,.2f}',
    )

    # 3. Active loans cap
    max_active = int(criteria['max_active_loans'])
    active_count = Loan.objects.filter(member=member, status='ACTIVE').count()
    add(
        'max_active_loans',
        'Active loans within cap',
        active_count < max_active or (
            loan_type.allow_multiple_active and active_count < max_active + 1
        ),
        active_count,
        max_active,
        'Counted across all loan types',
    )

    # 4. Income verification
    if criteria['require_income_verification']:
        add(
            'require_income_verification',
            'Income verified by administrator',
            member.income_verified,
            'Verified' if member.income_verified else 'Not verified',
            'Required',
        )

    # 5. No overdue installments anywhere
    if criteria['reject_if_any_overdue']:
        has_overdue = False
        for loan in Loan.objects.filter(member=member, status='ACTIVE'):
            if loan.schedules.filter(
                payment_status='OVERDUE', days_overdue__gt=0
            ).exists():
                has_overdue = True
                break
        add(
            'reject_if_any_overdue',
            'No overdue installments on existing loans',
            not has_overdue,
            'Overdue found' if has_overdue else 'None',
            'Required',
        )

    # 6. Not a defaulter
    if criteria['reject_if_defaulter']:
        worst = _worst_defaulter_classification(member)
        blocked = worst in ('DEFAULTER', 'SEVERE_DEFAULTER')
        add(
            'reject_if_defaulter',
            'Not classified as defaulter',
            not blocked,
            worst or 'CURRENT',
            'Below DEFAULTER',
        )

    # 7. Active membership
    if criteria['require_active_membership']:
        add(
            'require_active_membership',
            'Membership is active',
            member.membership_status == 'ACTIVE',
            member.membership_status,
            'ACTIVE',
            'New signups must be approved by an administrator first',
        )

    # 8. Minimum membership age
    min_days = int(criteria.get('min_membership_days', 0))
    if min_days > 0:
        from django.utils import timezone
        days_since = (timezone.now().date() - member.created_at.date()).days
        add(
            'min_membership_days',
            'Membership age requirement',
            days_since >= min_days,
            days_since,
            min_days,
            'Days since registration',
        )

    return {
        'passed': all(r['passed'] for r in results),
        'results': results,
    }
