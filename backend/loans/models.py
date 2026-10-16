import uuid

from django.db import models
from django.db.models.functions import Coalesce
from django.utils import timezone

from members.models import Member
from users.models import User


class LoanType(models.Model):
    """Configurable loan type with its own rules."""

    INTEREST_METHOD_CHOICES = [
        ('FLAT', 'Flat Rate'),
        ('REDUCING_BALANCE', 'Reducing Balance'),
        # UNZALARU flat loans: interest_rate% of the amount, charged once
        # regardless of the repayment period (K10,000 at 10% -> repay K11,000)
        ('FLAT_ONCE', 'Flat (charged once)'),
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
    allowed_amounts = models.JSONField(
        default=list, blank=True,
        help_text='Fixed amounts members may borrow, e.g. [10000, 15000, 20000]; '
                  'empty allows any amount between min_amount and max_amount',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'loan type'
        verbose_name_plural = 'loan types'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.interest_rate}% {self.get_interest_method_display()})'

    @classmethod
    def current(cls):
        """The loan product members apply for (UNZALARU offers a single flat loan)."""
        return cls.objects.filter(is_active=True).order_by('id').first()


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

    @property
    def previous_applications(self):
        """How many loan applications the member made before this one.

        Cancelled applications don't count. 0 means a first-time applicant,
        who gets priority. List views annotate this as
        `annotated_previous_applications` (see previous_applications_subquery).
        """
        annotated = self.__dict__.get('annotated_previous_applications')
        if annotated is not None:
            return annotated
        return (
            LoanApplication.objects.filter(member_id=self.member_id)
            .filter(
                # Ties (same timestamp) are broken by creation order
                models.Q(application_date__lt=self.application_date)
                | models.Q(application_date=self.application_date, pk__lt=self.pk)
            )
            .exclude(status='CANCELLED')
            .count()
        )

    @property
    def is_first_time_applicant(self):
        return self.previous_applications == 0


def previous_applications_subquery():
    """Per-application count of the member's earlier, non-cancelled applications."""
    earlier = (
        LoanApplication.objects.filter(member_id=models.OuterRef('member_id'))
        .filter(
            # Ties (same timestamp) are broken by creation order
            models.Q(application_date__lt=models.OuterRef('application_date'))
            | models.Q(
                application_date=models.OuterRef('application_date'),
                pk__lt=models.OuterRef('pk'),
            )
        )
        .exclude(status='CANCELLED')
        .order_by()
        .values('member_id')
        .annotate(n=models.Count('pk'))
        .values('n')
    )
    return Coalesce(
        models.Subquery(earlier, output_field=models.IntegerField()), 0
    )


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
