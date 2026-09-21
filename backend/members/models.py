import uuid

from django.db import models

from users.models import User


class Member(models.Model):
    """Member profile linked to a User account."""

    EMPLOYMENT_STATUS_CHOICES = [
        ('PERMANENT', 'Permanent'),
        ('CONTRACT', 'Contract'),
        ('PART_TIME', 'Part Time'),
        ('RETIRED', 'Retired'),
    ]

    MEMBERSHIP_STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('SUSPENDED', 'Suspended'),
    ]

    ACCOUNT_STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('DEACTIVATED', 'Deactivated'),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='member_profile'
    )
    member_id = models.CharField(max_length=20, unique=True, editable=False)
    nrc_number = models.CharField(max_length=20, unique=True)
    phone_number = models.CharField(max_length=20)
    address = models.TextField()
    department = models.CharField(max_length=100)
    employment_status = models.CharField(
        max_length=20, choices=EMPLOYMENT_STATUS_CHOICES
    )
    # Declared monthly income. Verified income is the figure an administrator
    # has confirmed from supporting documents; it falls back to declared.
    monthly_income = models.DecimalField(
        max_digits=12, decimal_places=2, help_text='Declared monthly income'
    )
    income_verified = models.BooleanField(
        default=False, help_text='Admin has verified the declared income'
    )
    verified_income = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text='Income verified by administrator (falls back to declared)'
    )
    income_verified_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='income_verifications'
    )
    membership_status = models.CharField(
        max_length=20, choices=MEMBERSHIP_STATUS_CHOICES, default='PENDING',
        help_text='New signups start as PENDING until admin approval'
    )
    approved_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='approved_members'
    )
    approval_date = models.DateTimeField(null=True, blank=True)
    account_status = models.CharField(
        max_length=20, choices=ACCOUNT_STATUS_CHOICES, default='ACTIVE'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'member'
        verbose_name_plural = 'members'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.member_id} - {self.user.get_full_name()}'

    def save(self, *args, **kwargs):
        if not self.member_id:
            self.member_id = f'MBR-{uuid.uuid4().hex[:8].upper()}'
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return self.user.get_full_name()

    @property
    def email(self):
        return self.user.email

    @property
    def effective_income(self):
        """Verified income if set, otherwise declared income."""
        return self.verified_income if self.verified_income is not None else self.monthly_income

    @property
    def is_pending(self):
        return self.membership_status == 'PENDING'
