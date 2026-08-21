from django.db import models

from loans.models import LoanApplication


class EligibilityRule(models.Model):
    """Configurable rule for eligibility scoring."""

    FACTOR_CHOICES = [
        ('INCOME', 'Income'),
        ('EMPLOYMENT', 'Employment Stability'),
        ('OBLIGATIONS', 'Existing Obligations'),
        ('REPAYMENT_HISTORY', 'Repayment History'),
    ]

    name = models.CharField(max_length=100)
    factor = models.CharField(max_length=50, choices=FACTOR_CHOICES, unique=True)
    weight = models.DecimalField(
        max_digits=5, decimal_places=2,
        help_text='Weight as percentage (e.g., 30.00 for 30%)'
    )
    thresholds = models.JSONField(
        default=list,
        help_text='List of threshold objects: [{"min": 0, "max": 5000, "score": 20}, ...]'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'eligibility rule'
        verbose_name_plural = 'eligibility rules'
        ordering = ['-weight']

    def __str__(self):
        return f'{self.name} (weight: {self.weight}%)'


class EligibilityScore(models.Model):
    """Calculated eligibility score for a loan application."""

    RECOMMENDATION_CHOICES = [
        ('ELIGIBLE', 'Eligible'),
        ('REVIEW', 'Review'),
        ('NOT_ELIGIBLE', 'Not Eligible'),
    ]

    application = models.OneToOneField(
        LoanApplication, on_delete=models.CASCADE, related_name='eligibility'
    )
    total_score = models.DecimalField(max_digits=5, decimal_places=2)
    breakdown = models.JSONField(
        default=dict,
        help_text='Score breakdown by factor'
    )
    recommendation = models.CharField(max_length=20, choices=RECOMMENDATION_CHOICES)
    reasons = models.JSONField(default=list)
    calculated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'eligibility score'
        verbose_name_plural = 'eligibility scores'
        ordering = ['-calculated_at']

    def __str__(self):
        return f'{self.application.application_id} - {self.total_score}/100 ({self.recommendation})'
