from django.utils import timezone

from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from audit.services import AuditService
from notifications.services import NotificationService
from users.permissions import IsAdminUser, IsStaffUser
from users.models import User

from .filters import MemberFilter
from .models import Member
from .serializers import (
    IncomeVerificationSerializer,
    MemberCreateSerializer,
    MemberListSerializer,
    MemberSelfSignupSerializer,
    MemberSelfUpdateSerializer,
    MemberSerializer,
    MemberUpdateSerializer,
)


class MemberSignupView(generics.CreateAPIView):
    """Public member self-registration.

    Creates a MEMBER user account and a PENDING member profile.
    The account can sign in immediately, but loan features remain locked
    until an administrator approves the membership.
    """

    permission_classes = [AllowAny]
    serializer_class = MemberSelfSignupSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member = serializer.save()

        NotificationService.notify_member_pending_approval(member)
        AuditService.log_action(
            user=member.user,
            action='MEMBER_SIGNED_UP',
            entity_type='Member',
            entity_id=member.member_id,
            description=(
                f'Member {member.full_name} ({member.member_id}) registered '
                f'and is awaiting approval'
            ),
        )

        return Response(
            {
                'message': (
                    'Registration successful. Your account is pending '
                    'approval by a UNZALARU administrator.'
                ),
                'member_id': member.member_id,
                'membership_status': member.membership_status,
            },
            status=status.HTTP_201_CREATED,
        )


class MemberViewSet(viewsets.ModelViewSet):
    """
    Member management endpoints.

    Admins manage members fully (create, update, approve/reject, delete).
    Supervisors have read access plus income verification, which feeds the
    loan approval workflow; lifecycle actions remain admin-only.
    """

    permission_classes = [IsAdminUser]
    filterset_class = MemberFilter
    search_fields = [
        'member_id', 'user__first_name', 'user__last_name', 'user__email',
        'department',
    ]
    ordering_fields = ['created_at', 'monthly_income']

    def get_permissions(self):
        # Members may access their own profile endpoints; everything else is staff.
        if self.action in ('me', 'update_me'):
            return [IsAuthenticated()]
        if self.action in ('list', 'retrieve', 'loan_history', 'repayment_history',
                           'eligibility_history', 'defaulter_history', 'verify_income'):
            return [IsStaffUser()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        return Member.objects.select_related('user').all()

    def get_serializer_class(self):
        if self.action == 'create':
            return MemberCreateSerializer
        if self.action == 'list':
            return MemberListSerializer
        if self.action in ['update', 'partial_update']:
            return MemberUpdateSerializer
        return MemberSerializer

    def perform_create(self, serializer):
        member = serializer.save()
        AuditService.log_action(
            user=self.request.user,
            action='MEMBER_CREATED',
            entity_type='Member',
            entity_id=member.member_id,
            description=f'Admin created member {member.full_name} ({member.member_id})',
        )

    def perform_update(self, serializer):
        member = serializer.save()
        AuditService.log_action(
            user=self.request.user,
            action='MEMBER_UPDATED',
            entity_type='Member',
            entity_id=member.member_id,
            description=f'Admin updated member {member.member_id}',
        )

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get the current member's own profile."""
        try:
            member = Member.objects.select_related('user').get(user=request.user)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Member profile not found'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(MemberSerializer(member).data)

    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        """Update the current member's own contact details."""
        try:
            member = Member.objects.get(user=request.user)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Member profile not found'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = MemberSelfUpdateSerializer(
            member, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MemberSerializer(member).data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a pending member. Admin action."""
        member = self.get_object()
        if member.membership_status != 'PENDING':
            return Response(
                {'error': f'Cannot approve member with status {member.membership_status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        member.membership_status = 'ACTIVE'
        member.approved_by = request.user
        member.approval_date = timezone.now()
        member.save()

        NotificationService.notify_member_approved(member)
        AuditService.log_action(
            user=request.user,
            action='MEMBER_APPROVED',
            entity_type='Member',
            entity_id=member.member_id,
            description=f'Admin approved member {member.full_name} ({member.member_id})',
        )
        return Response(MemberSerializer(member).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a pending member signup. Admin action."""
        member = self.get_object()
        if member.membership_status != 'PENDING':
            return Response(
                {'error': f'Cannot reject member with status {member.membership_status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get('reason', '')
        member.membership_status = 'INACTIVE'
        member.account_status = 'DEACTIVATED'
        member.user.is_active = False
        member.user.save()
        member.save()

        NotificationService.notify_member_rejected(member, reason)
        AuditService.log_action(
            user=request.user,
            action='MEMBER_REJECTED',
            entity_type='Member',
            entity_id=member.member_id,
            description=(
                f'Admin rejected member signup {member.full_name} '
                f'({member.member_id}). Reason: {reason or "not provided"}'
            ),
        )
        return Response(MemberSerializer(member).data)

    @action(detail=True, methods=['post'], url_path='verify-income')
    def verify_income(self, request, pk=None):
        """Verify (or update) a member's income. Admin action."""
        member = self.get_object()
        serializer = IncomeVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        verified_income = serializer.validated_data.get('verified_income')
        notes = serializer.validated_data.get('notes', '')

        member.verified_income = verified_income
        member.income_verified = True
        member.income_verified_by = request.user
        member.save()

        NotificationService.notify_income_verified(member)
        AuditService.log_action(
            user=request.user,
            action='INCOME_VERIFIED',
            entity_type='Member',
            entity_id=member.member_id,
            description=(
                f'Admin verified income for {member.member_id}: '
                f'K{member.effective_income} ({notes})' if notes else
                f'Admin verified income for {member.member_id}: K{member.effective_income}'
            ),
            new_value={'verified_income': str(verified_income)},
        )
        return Response(MemberSerializer(member).data)

    @action(detail=True, methods=['get'], url_path='loan-history')
    def loan_history(self, request, pk=None):
        """Get loan history for a member."""
        member = self.get_object()
        from loans.models import Loan
        from loans.serializers import LoanSerializer

        loans = Loan.objects.filter(member=member).order_by('-created_at')
        serializer = LoanSerializer(loans, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='repayment-history')
    def repayment_history(self, request, pk=None):
        """Get repayment history for a member."""
        member = self.get_object()
        from repayments.models import Repayment
        from repayments.serializers import RepaymentSerializer

        repayments = Repayment.objects.filter(
            loan__member=member
        ).select_related('loan', 'schedule').order_by('-payment_date')
        serializer = RepaymentSerializer(repayments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='eligibility-history')
    def eligibility_history(self, request, pk=None):
        """Get eligibility score history for a member."""
        member = self.get_object()
        from eligibility.models import EligibilityScore
        from eligibility.serializers import EligibilityScoreSerializer

        scores = EligibilityScore.objects.filter(
            application__member=member
        ).order_by('-calculated_at')
        serializer = EligibilityScoreSerializer(scores, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='defaulter-history')
    def defaulter_history(self, request, pk=None):
        """Get defaulter classification history for a member."""
        member = self.get_object()
        from defaulters.models import DefaulterStatus
        from defaulters.serializers import DefaulterStatusSerializer

        statuses = DefaulterStatus.objects.filter(
            member=member
        ).select_related('loan', 'schedule').order_by('-created_at')
        serializer = DefaulterStatusSerializer(statuses, many=True)
        return Response(serializer.data)
