from django.db import models

from users.models import User

# Annotation for member querysets: loan applications, excluding cancelled ones
APPLICATION_COUNT = models.Count(
    'applications', filter=~models.Q(applications__status='CANCELLED')
)


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
    # The member's UNZA MAN number (staff number), entered at registration;
    # it is the ID used for members throughout the system.
    member_id = models.CharField(
        'MAN number', max_length=20, unique=True,
        help_text='UNZA MAN number used to identify the member',
    )
    nrc_number = models.CharField(max_length=20, unique=True)
    phone_number = models.CharField(max_length=20)
    address = models.TextField()
    department = models.CharField(max_length=100)
    # Worked out from the department (see members/schools.py) on every save
    school = models.CharField(max_length=120, blank=True, db_index=True)
    employment_status = models.CharField(
        max_length=20, choices=EMPLOYMENT_STATUS_CHOICES
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
        from .schools import school_for_department

        self.school = school_for_department(self.department) or self.school
        update_fields = kwargs.get('update_fields')
        if update_fields is not None and 'department' in update_fields:
            kwargs['update_fields'] = {*update_fields, 'school'}
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return self.user.get_full_name()

    @property
    def email(self):
        return self.user.email

    @property
    def application_count(self):
        """How many times the member has applied for a loan.

        Cancelled applications don't count. List views annotate this as
        `annotated_application_count` (see APPLICATION_COUNT) to avoid a
        query per member.
        """
        annotated = self.__dict__.get('annotated_application_count')
        if annotated is not None:
            return annotated
        return self.applications.exclude(status='CANCELLED').count()

    @property
    def is_pending(self):
        return self.membership_status == 'PENDING'
