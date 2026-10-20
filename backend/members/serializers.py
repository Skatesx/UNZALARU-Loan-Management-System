import re

from rest_framework import serializers

from users.serializers import UserSerializer
from users.validators import validate_person_name

from .models import Member

# UNZA MAN (staff) numbers are exactly six digits
MAN_NUMBER_PATTERN = re.compile(r'^\d{6}$')
# Zambian National Registration Card number: 123456/78/1
NRC_PATTERN = re.compile(r'^\d{6}/\d{2}/\d$')
# Zambian phone number after removing spaces: 0971234567 or +260971234567
PHONE_PATTERN = re.compile(r'^(?:\+260|0)(\d{9})$')


def validate_nrc(value):
    value = ''.join((value or '').split())
    if not NRC_PATTERN.match(value):
        raise serializers.ValidationError(
            'Enter the NRC number as on the card, e.g. 123456/78/1'
        )
    return value


def validate_phone(value):
    """Accept 0971234567 or +260 97 123 4567 and store +260971234567."""
    compact = re.sub(r'[\s\-()]', '', value or '')
    match = PHONE_PATTERN.match(compact)
    if not match:
        raise serializers.ValidationError(
            'Enter a Zambian phone number, e.g. 0971234567 or +260971234567'
        )
    return '+260' + match.group(1)


class ContactFieldsMixin:
    """Shared format checks for NRC and phone numbers.

    Values that are not being changed are left alone, so records created
    before these checks existed can still be edited.
    """

    def _unchanged(self, field, value):
        instance = getattr(self, 'instance', None)
        return instance is not None and getattr(instance, field) == value

    def validate_nrc_number(self, value):
        if self._unchanged('nrc_number', value):
            return value
        value = validate_nrc(value)
        others = Member.objects.filter(nrc_number__iexact=value)
        if getattr(self, 'instance', None) is not None:
            others = others.exclude(pk=self.instance.pk)
        if others.exists():
            raise serializers.ValidationError(
                'A member with this NRC number already exists'
            )
        return value

    def validate_phone_number(self, value):
        if self._unchanged('phone_number', value):
            return value
        return validate_phone(value)


class PersonNameMixin:
    """First and last names: letters, spaces, hyphens and apostrophes only."""

    def validate_first_name(self, value):
        return validate_person_name(value)

    def validate_last_name(self, value):
        return validate_person_name(value)


def validate_man_number(value):
    """Normalise a MAN number and check it is well-formed and unused."""
    value = (value or '').strip()
    if not MAN_NUMBER_PATTERN.match(value):
        raise serializers.ValidationError('A MAN number is exactly 6 digits')
    if Member.objects.filter(member_id__iexact=value).exists():
        raise serializers.ValidationError(
            'A member with this MAN number already exists'
        )
    return value


def tidy_group_name(field, value):
    """Clean up a school or department name so members group together in reports.

    Extra spaces are removed, and if another member already entered the same
    name with different capitals, their spelling is reused.
    """
    value = ' '.join((value or '').split())
    if not value:
        raise serializers.ValidationError('This field may not be blank.')
    if any(ch.isdigit() for ch in value) or not any(ch.isalpha() for ch in value):
        raise serializers.ValidationError('Use the name in words, without numbers')
    existing = (
        Member.objects.filter(**{f'{field}__iexact': value})
        .values_list(field, flat=True)
        .first()
    )
    return existing or value


class GroupFieldsMixin:
    """Shared validation for the school and department fields."""

    def validate_school(self, value):
        return tidy_group_name('school', value)

    def validate_department(self, value):
        return tidy_group_name('department', value)


class MemberSerializer(serializers.ModelSerializer):
    """Full member serializer with user details."""

    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)
    application_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Member
        fields = [
            'id', 'member_id', 'user', 'nrc_number', 'phone_number',
            'address', 'department', 'school', 'employment_status',
            'membership_status', 'approved_by', 'approval_date',
            'account_status', 'application_count', 'data_consent_at',
            'full_name', 'email', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'member_id', 'approved_by', 'approval_date',
            'data_consent_at', 'created_at', 'updated_at',
        ]


class MemberListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for member lists."""

    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    application_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Member
        fields = [
            'id', 'member_id', 'full_name', 'email', 'department', 'school',
            'employment_status', 'membership_status', 'account_status',
            'application_count', 'created_at',
        ]


class MemberCreateSerializer(PersonNameMixin, ContactFieldsMixin, GroupFieldsMixin,
                             serializers.ModelSerializer):
    """Serializer for creating members with user account."""

    member_id = serializers.CharField(max_length=20)
    email = serializers.EmailField(write_only=True)
    username = serializers.CharField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Member
        fields = [
            'member_id', 'email', 'username', 'first_name', 'last_name',
            'password', 'nrc_number', 'phone_number', 'address',
            'school', 'department', 'employment_status',
        ]
        extra_kwargs = {'school': {'required': True, 'allow_blank': False}}

    def validate_member_id(self, value):
        return validate_man_number(value)

    def create(self, validated_data):
        from users.models import User

        user_data = {
            'email': validated_data.pop('email'),
            'username': validated_data.pop('username'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'password': validated_data.pop('password'),
            'role': 'MEMBER',
        }

        user = User.objects.create_user(**user_data)
        # Admin-created members are immediately active.
        member = Member.objects.create(
            user=user,
            membership_status='ACTIVE',
            **validated_data
        )
        return member


class MemberSelfSignupSerializer(PersonNameMixin, ContactFieldsMixin, GroupFieldsMixin,
                                 serializers.ModelSerializer):
    """Serializer for public member self-registration.

    Creates a MEMBER user and a PENDING member profile awaiting admin approval.
    """

    member_id = serializers.CharField(max_length=20)
    email = serializers.EmailField(source='user_email')
    first_name = serializers.CharField(max_length=150, source='user_first_name')
    last_name = serializers.CharField(max_length=150, source='user_last_name')
    password = serializers.CharField(write_only=True, min_length=8)
    # The member must agree to the privacy notice (how their data is used)
    consent = serializers.BooleanField(write_only=True)

    class Meta:
        model = Member
        fields = [
            'member_id', 'email', 'first_name', 'last_name', 'password',
            'nrc_number', 'phone_number', 'address', 'school', 'department',
            'employment_status', 'consent',
        ]
        extra_kwargs = {'school': {'required': True, 'allow_blank': False}}

    def validate_member_id(self, value):
        return validate_man_number(value)

    def validate_consent(self, value):
        if value is not True:
            raise serializers.ValidationError(
                'You must agree to the privacy notice to register'
            )
        return value

    def validate_email(self, value):
        from users.models import User
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                'An account with this email already exists'
            )
        return value

    def create(self, validated_data):
        from django.utils import timezone

        from users.models import User

        validated_data.pop('consent')
        validated_data['data_consent_at'] = timezone.now()
        user_email = validated_data.pop('user_email')
        user_first_name = validated_data.pop('user_first_name')
        user_last_name = validated_data.pop('user_last_name')
        user = User.objects.create_user(
            email=user_email,
            username=user_email.split('@')[0],
            first_name=user_first_name,
            last_name=user_last_name,
            password=validated_data.pop('password'),
            role='MEMBER',
        )
        # Membership is PENDING until an administrator approves it.
        return Member.objects.create(user=user, **validated_data)


class MemberUpdateSerializer(ContactFieldsMixin, GroupFieldsMixin, serializers.ModelSerializer):
    """Serializer for updating member profile."""

    class Meta:
        model = Member
        fields = [
            'nrc_number', 'phone_number', 'address', 'school', 'department',
            'employment_status', 'membership_status', 'account_status',
        ]


class MemberSelfUpdateSerializer(ContactFieldsMixin, serializers.ModelSerializer):
    """Serializer for members updating their own contact details."""

    class Meta:
        model = Member
        fields = ['phone_number', 'address']
