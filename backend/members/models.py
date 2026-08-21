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
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2)
    date_joined = models.DateField(auto_now_add=True)
    membership_status = models.CharField(
        max_length=20, choices=MEMBERSHIP_STATUS_CHOICES, default='ACTIVE'
    )
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
