from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import User
from .permissions import IsAdminUser
from .serializers import (
    CustomTokenObtainPairSerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    StaffCreateSerializer,
    StaffSerializer,
    StaffUpdateSerializer,
    UserSerializer,
)

# Readable temporary passwords (no 0/O, 1/l/I) for an admin to hand over
TEMP_PASSWORD_CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'


def temporary_password():
    from django.utils.crypto import get_random_string

    return get_random_string(10, TEMP_PASSWORD_CHARS)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view using email instead of username."""
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """Logout view that blacklists the refresh token."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'message': 'Successfully logged out'},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class PasswordChangeView(APIView):
    """Change password for authenticated user."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response(
            {'message': 'Password changed successfully'},
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    """Email a password reset link (valid for a limited time)."""

    permission_classes = [AllowAny]

    def post(self, request):
        from django.conf import settings
        from django.contrib.auth.tokens import default_token_generator
        from django.core.mail import send_mail
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            link = f'{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}'
            hours = settings.PASSWORD_RESET_TIMEOUT // 3600
            send_mail(
                subject='Reset your UNZALARU password',
                message=(
                    f'Hello {user.first_name or user.email},\n\n'
                    f'Use this link to choose a new password for your UNZALARU '
                    f'Loans account:\n\n{link}\n\n'
                    f'The link stops working once it has been used or after '
                    f'{hours} hours. If you did not ask for this, you can '
                    f'ignore this email.'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
            )

        # Same answer either way, so the form doesn't reveal who has an account
        return Response(
            {'message': 'If an account exists with this email, a reset link has been sent'},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """Set a new password from the emailed link's uid and token."""

    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_str
        from django.utils.http import urlsafe_base64_decode

        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        invalid = Response(
            {'error': 'This reset link is invalid or has expired. Request a new one.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
        try:
            pk = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=pk, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return invalid
        if not default_token_generator.check_token(user, serializer.validated_data['token']):
            return invalid

        # Changing the password also invalidates the link (the token depends on it)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response(
            {'message': 'Your password has been reset. You can now sign in.'},
            status=status.HTTP_200_OK,
        )


class AdminResetPasswordView(APIView):
    """Admin sets a temporary password for any member or staff account.

    The password is returned once, for the admin to hand over; the person
    should change it after signing in.
    """

    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        from audit.services import AuditService

        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        password = temporary_password()
        user.set_password(password)
        user.save()
        AuditService.log_action(
            user=request.user,
            action='PASSWORD_RESET_BY_ADMIN',
            entity_type='User',
            entity_id=user.pk,
            description=f'Admin set a temporary password for {user.email}',
        )
        return Response({'email': user.email, 'temporary_password': password})


class StaffListCreateView(generics.ListCreateAPIView):
    """Admin: list admin/supervisor accounts, or add one with a temporary password."""

    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return User.objects.filter(role__in=['ADMIN', 'SUPERVISOR']).order_by(
            'role', 'first_name', 'last_name'
        )

    def get_serializer_class(self):
        return StaffCreateSerializer if self.request.method == 'POST' else StaffSerializer

    def create(self, request, *args, **kwargs):
        from audit.services import AuditService

        serializer = StaffCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        base = data['email'].split('@')[0][:140] or 'staff'
        username, n = base, 1
        while User.objects.filter(username=username).exists():
            n += 1
            username = f'{base}{n}'

        password = temporary_password()
        user = User.objects.create_user(
            email=data['email'],
            username=username,
            password=password,
            first_name=data['first_name'],
            last_name=data['last_name'],
            role=data['role'],
        )
        AuditService.log_action(
            user=request.user,
            action='STAFF_CREATED',
            entity_type='User',
            entity_id=user.pk,
            description=f'Added {user.get_role_display().lower()} {user.get_full_name()} ({user.email})',
        )
        return Response(
            {**StaffSerializer(user).data, 'temporary_password': password},
            status=status.HTTP_201_CREATED,
        )


class StaffDetailView(generics.RetrieveUpdateAPIView):
    """Admin: change a staff member's role or switch their account on/off."""

    permission_classes = [IsAdminUser]
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        return User.objects.filter(role__in=['ADMIN', 'SUPERVISOR'])

    def get_serializer_class(self):
        return StaffUpdateSerializer if self.request.method == 'PATCH' else StaffSerializer

    def partial_update(self, request, *args, **kwargs):
        from audit.services import AuditService

        user = self.get_object()
        serializer = StaffUpdateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        role = serializer.validated_data.get('role', user.role)
        active = serializer.validated_data.get('is_active', user.is_active)

        if user == request.user and (role != user.role or not active):
            return Response(
                {'error': "You can't change your own role or deactivate your own account"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        losing_admin = user.role == 'ADMIN' and user.is_active and (role != 'ADMIN' or not active)
        if losing_admin and not User.objects.filter(
            role='ADMIN', is_active=True
        ).exclude(pk=user.pk).exists():
            return Response(
                {'error': 'There must always be at least one active admin'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        changes = []
        if role != user.role:
            changes.append(f'role {user.role} -> {role}')
        if active != user.is_active:
            changes.append('reactivated' if active else 'deactivated')
        serializer.save()
        if changes:
            AuditService.log_action(
                user=request.user,
                action='STAFF_UPDATED',
                entity_type='User',
                entity_id=user.pk,
                description=f'{user.get_full_name()} ({user.email}): {", ".join(changes)}',
            )
        return Response(StaffSerializer(user).data)


class UserListCreateView(generics.ListAPIView):
    """List all users (read-only).

    Staff accounts are managed through StaffListCreateView/StaffDetailView and
    members through the members API: deleting a user here would cascade to the
    member's loans and history, and editing roles here bypassed every check.
    """

    permission_classes = [IsAdminUser]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.all()


class UserDetailView(generics.RetrieveAPIView):
    """Retrieve a user (read-only; see UserListCreateView)."""

    permission_classes = [IsAdminUser]
    serializer_class = UserSerializer
    queryset = User.objects.all()
