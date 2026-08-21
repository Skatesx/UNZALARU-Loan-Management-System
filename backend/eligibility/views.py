from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsAdminUser, IsOwnerOrAdmin

from .models import EligibilityRule, EligibilityScore
from .serializers import (
    EligibilityRuleSerializer,
    EligibilityScoreListSerializer,
    EligibilityScoreSerializer,
)
from .services import EligibilityScoringService


class EligibilityRuleViewSet(viewsets.ModelViewSet):
    """Eligibility rule management endpoints (admin only)."""

    permission_classes = [IsAdminUser]
    queryset = EligibilityRule.objects.all()
    serializer_class = EligibilityRuleSerializer
    search_fields = ['name', 'factor']
    filterset_fields = ['factor', 'is_active']


class EligibilityScoreViewSet(viewsets.ReadOnlyModelViewSet):
    """Eligibility score endpoints."""

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return EligibilityScore.objects.select_related(
                'application', 'application__member', 'application__member__user'
            ).all()
        # Members can only see their own scores
        from members.models import Member
        try:
            member = Member.objects.get(user=user)
            return EligibilityScore.objects.select_related(
                'application', 'application__member', 'application__member__user'
            ).filter(application__member=member)
        except Member.DoesNotExist:
            return EligibilityScore.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return EligibilityScoreListSerializer
        return EligibilityScoreSerializer

    @action(detail=False, methods=['post'], url_path='recalculate/(?P<application_id>[^/.]+)')
    def recalculate(self, request, application_id=None):
        """Recalculate eligibility score for an application."""
        from loans.models import LoanApplication

        try:
            application = LoanApplication.objects.get(application_id=application_id)
        except LoanApplication.DoesNotExist:
            return Response(
                {'error': 'Application not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        service = EligibilityScoringService()
        score = service.calculate(application)
        return Response(
            EligibilityScoreSerializer(score).data,
            status=status.HTTP_200_OK,
        )
