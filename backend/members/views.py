from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from users.permissions import IsAdminUser, IsOwnerOrAdmin

from .filters import MemberFilter
from .models import Member
from .serializers import (
    MemberCreateSerializer,
    MemberListSerializer,
    MemberSerializer,
    MemberUpdateSerializer,
)


class MemberViewSet(viewsets.ModelViewSet):
    """
    Member management endpoints.
    Admin can manage all members.
    """

    permission_classes = [IsAdminUser]
    filterset_class = MemberFilter
    search_fields = ['member_id', 'user__first_name', 'user__last_name', 'user__email', 'department']
    ordering_fields = ['created_at', 'monthly_income', 'date_joined']

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
