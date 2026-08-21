from django.db import models

from users.models import User


class Notification(models.Model):
    """In-system notification for users."""

    TYPE_CHOICES = [
        ('LOAN_SUBMITTED', 'Loan Submitted'),
        ('LOAN_APPROVED', 'Loan Approved'),
        ('LOAN_REJECTED', 'Loan Rejected'),
        ('REPAYMENT_DUE', 'Repayment Due'),
        ('REPAYMENT_OVERDUE', 'Repayment Overdue'),
        ('STATUS_CHANGE', 'Status Change'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    is_read = models.BooleanField(default=False)
    related_loan = models.ForeignKey(
        'loans.Loan', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='notifications'
    )
    related_application = models.ForeignKey(
        'loans.LoanApplication', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='notifications'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'notification'
        verbose_name_plural = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} - {self.title}'
