from rest_framework import serializers

from users.serializers import UserSerializer

from .models import Member


class MemberSerializer(serializers.ModelSerializer):
    """Full member serializer with user details."""

    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)

    class Meta:
        model = Member
        fields = [
            'id', 'member_id', 'user', 'nrc_number', 'phone_number',
            'address', 'department', 'employment_status', 'monthly_income',
            'date_joined', 'membership_status', 'account_status',
            'full_name', 'email', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'member_id', 'created_at', 'updated_at']


class MemberListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for member lists."""

    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Member
        fields = [
            'id', 'member_id', 'full_name', 'email', 'department',
            'employment_status', 'monthly_income', 'membership_status',
            'account_status', 'date_joined',
        ]


class MemberCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating members with user account."""

    email = serializers.EmailField(write_only=True)
    username = serializers.CharField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Member
        fields = [
            'email', 'username', 'first_name', 'last_name', 'password',
            'nrc_number', 'phone_number', 'address', 'department',
            'employment_status', 'monthly_income',
        ]

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
        member = Member.objects.create(user=user, **validated_data)
        return member


class MemberUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating member profile."""

    class Meta:
        model = Member
        fields = [
            'nrc_number', 'phone_number', 'address', 'department',
            'employment_status', 'monthly_income', 'membership_status',
            'account_status',
        ]
