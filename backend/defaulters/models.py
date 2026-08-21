from django.db import models

from loans.models import Loan
from members.models import Member
from repayments.models import RepaymentSchedule


class DefaulterStatus(models.Model):
    """Tracks defaulter classification for members with overdue payments."""

    CLASSIFICATION_CHOICES = [
        ('CURRENT', 'Current'),
        ('AT_RISK', 'At Risk'),
        ('DEFAULTER', 'Defaulter'),
        ('SEVERE_DEFAULTER', 'Severe Defaulter'),
    ]

    member = models.ForeignKey(
        Member, on_delete=models.CASCADE, related_name='defaulter_statuses'
    )
    loan = models.ForeignKey(
        Loan, on_delete=models.CASCADE, related_name='defaulter_statuses'
    )
    schedule = models.ForeignKey(
        RepaymentSchedule, on_delete=models.CASCADE, related_name='defaulter_statuses'
    )
    days_overdue = models.IntegerField()
    classification = models.CharField(max_length=20, choices=CLASSIFICATION_CHOICES)
    last_checked = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'defaulter status'
        verbose_name_plural = 'defaulter statuses'
        ordering = ['-days_overdue']
        unique_together = ['member', 'loan', 'schedule']

    def __str__(self):
        return f'{self.member.member_id} - {self.loan.loan_id} - {self.classification}'
