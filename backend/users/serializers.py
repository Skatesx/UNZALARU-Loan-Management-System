from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User
from .validators import validate_person_name


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer that uses email as USERNAME_FIELD."""

    username_field = 'email'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        return token

    def validate(self, attrs):
        # Use email as the username field
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials')

            if not user.check_password(password):
                raise serializers.ValidationError('Invalid credentials')

            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')

            attrs['username'] = user.username
        else:
            raise serializers.ValidationError('Email and password are required')

        return super().validate(attrs)


class LoginSerializer(serializers.Serializer):
    """Serializer for login endpoint."""

    email = serializers.EmailField()
    password = serializers.CharField()


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change."""

    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect')
        return value

    def validate_new_password(self, value):
        from django.contrib.auth.password_validation import validate_password

        validate_password(value, user=self.context['request'].user)
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request."""

    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation (from the emailed link)."""

    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_new_password(self, value):
        from django.contrib.auth.password_validation import validate_password

        validate_password(value)
        return value


STAFF_ROLES = [('ADMIN', 'Administrator'), ('SUPERVISOR', 'Supervisor')]


class StaffSerializer(serializers.ModelSerializer):
    """Admin and supervisor accounts."""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role', 'is_active',
            'last_login', 'created_at',
        ]
        read_only_fields = fields


class StaffCreateSerializer(serializers.ModelSerializer):
    """Add an admin or supervisor; a temporary password is generated."""

    role = serializers.ChoiceField(choices=STAFF_ROLES)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'role']
        extra_kwargs = {
            'first_name': {'required': True, 'allow_blank': False},
            'last_name': {'required': True, 'allow_blank': False},
        }

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with this email already exists')
        return value

    def validate_first_name(self, value):
        return validate_person_name(value)

    def validate_last_name(self, value):
        return validate_person_name(value)


class StaffUpdateSerializer(serializers.ModelSerializer):
    """Change a staff member's role or switch their account on/off."""

    role = serializers.ChoiceField(choices=STAFF_ROLES, required=False)

    class Meta:
        model = User
        fields = ['role', 'is_active']
