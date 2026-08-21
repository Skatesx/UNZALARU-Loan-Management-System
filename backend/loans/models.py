import uuid

from django.db import models
from django.utils import timezone

from members.models import Member
from users.models import User


class LoanType(models.Model):
    """Configurable loan type with its own rules."""

    INTEREST_METHOD_CHOICES = [
        ('FLAT', 'Flat Rate'),
        ('REDUCING_BALANCE', 'Reducing Balance'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField()
    min_amount = models.DecimalField(max_digits=12, decimal_places=2)
    max_amount = models.DecimalField(max_digits=12, decimal_places=2)
    min_duration_months = models.IntegerField()
    max_duration_months = models.IntegerField()
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    interest_method = models.CharField(
        max_length=20, choices=INTEREST_METHOD_CHOICES, default='FLAT'
    )
    allow_multiple_active = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'loan type'
        verbose_name_plural = 'loan types'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.interest_rate}% {self.get_interest_method_display()})'


class LoanApplication(models.Model):
    """Loan application submitted by a member."""

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('UNDER_REVIEW', 'Under Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]

    application_id = models.CharField(max_length=20, unique=True, editable=False)
    member = models.ForeignKey(
        Member, on_delete=models.CASCADE, related_name='applications'
    )
    loan_type = models.ForeignKey(LoanType, on_delete=models.PROTECT)
    requested_amount = models.DecimalField(max_digits=12, decimal_places=2)
    duration_months = models.IntegerField()
    purpose = models.TextField()
    application_date = models.DateTimeField(auto_now_add=True)
    current_employment_info = models.JSONField(default=dict)
    income_info = models.JSONField(default=dict)
    existing_loan_obligations = models.JSONField(default=list)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='PENDING'
    )
    rejection_reason = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='reviewed_applications'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'loan application'
        verbose_name_plural = 'loan applications'
        ordering = ['-application_date']

    def __str__(self):
        return f'{self.application_id} - {self.member.member_id} - K{self.requested_amount}'

    def save(self, *args, **kwargs):
        if not self.application_id:
            self.application_id = f'APP-{uuid.uuid4().hex[:8].upper()}'
        super().save(*args, **kwargs)


class Loan(models.Model):
    """Active loan created when an application is approved."""

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('DEFAULTED', 'Defaulted'),
        ('WRITTEN_OFF', 'Written Off'),
    ]

    loan_id = models.CharField(max_length=20, unique=True, editable=False)
    application = models.OneToOneField(
        LoanApplication, on_delete=models.CASCADE, related_name='loan'
    )
    member = models.ForeignKey(
        Member, on_delete=models.CASCADE, related_name='loans'
    )
    loan_type = models.ForeignKey(LoanType, on_delete=models.PROTECT)
    principal = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    interest_method = models.CharField(max_length=20)
    total_interest = models.DecimalField(max_digits=12, decimal_places=2)
    total_repayment = models.DecimalField(max_digits=12, decimal_places=2)
    duration_months = models.IntegerField()
    monthly_installment = models.DecimalField(max_digits=12, decimal_places=2)
    amount_repaid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='ACTIVE'
    )
    date_approved = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approved_loans'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'loan'
        verbose_name_plural = 'loans'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.loan_id} - {self.member.member_id} - K{self.principal}'

    def save(self, *args, **kwargs):
        if not self.loan_id:
            self.loan_id = f'LN-{uuid.uuid4().hex[:8].upper()}'
        super().save(*args, **kwargs)
