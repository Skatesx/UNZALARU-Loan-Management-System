import re

from rest_framework import serializers

from users.serializers import UserSerializer

from .models import Member

MAN_NUMBER_PATTERN = re.compile(r'^[A-Z0-9-]{3,20}$')


def validate_man_number(value):
    """Normalise a MAN number and check it is well-formed and unused."""
    value = (value or '').strip().upper()
    if not MAN_NUMBER_PATTERN.match(value):
        raise serializers.ValidationError(
            'Enter a valid MAN number (3-20 letters, digits or dashes)'
        )
    if Member.objects.filter(member_id__iexact=value).exists():
        raise serializers.ValidationError(
            'A member with this MAN number already exists'
        )
    return value


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
            'address', 'department', 'employment_status',
            'membership_status', 'approved_by', 'approval_date',
            'account_status', 'application_count',
            'full_name', 'email', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'member_id', 'approved_by', 'approval_date',
            'created_at', 'updated_at',
        ]


class MemberListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for member lists."""

    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    application_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Member
        fields = [
            'id', 'member_id', 'full_name', 'email', 'department',
            'employment_status', 'membership_status', 'account_status',
            'application_count', 'created_at',
        ]


class MemberCreateSerializer(serializers.ModelSerializer):
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
            'department', 'employment_status',
        ]

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


class MemberSelfSignupSerializer(serializers.ModelSerializer):
    """Serializer for public member self-registration.

    Creates a MEMBER user and a PENDING member profile awaiting admin approval.
    """

    member_id = serializers.CharField(max_length=20)
    email = serializers.EmailField(source='user_email')
    first_name = serializers.CharField(max_length=150, source='user_first_name')
    last_name = serializers.CharField(max_length=150, source='user_last_name')
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Member
        fields = [
            'member_id', 'email', 'first_name', 'last_name', 'password',
            'nrc_number', 'phone_number', 'address', 'department',
            'employment_status',
        ]

    def validate_member_id(self, value):
        return validate_man_number(value)

    def validate_email(self, value):
        from users.models import User
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                'An account with this email already exists'
            )
        return value

    def validate_nrc_number(self, value):
        if Member.objects.filter(nrc_number__iexact=value).exists():
            raise serializers.ValidationError(
                'A member with this NRC number already exists'
            )
        return value

    def create(self, validated_data):
        from users.models import User

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


class MemberUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating member profile."""

    class Meta:
        model = Member
        fields = [
            'nrc_number', 'phone_number', 'address', 'department',
            'employment_status', 'membership_status', 'account_status',
        ]


class MemberSelfUpdateSerializer(serializers.ModelSerializer):
    """Serializer for members updating their own contact details."""

    class Meta:
        model = Member
        fields = ['phone_number', 'address']
