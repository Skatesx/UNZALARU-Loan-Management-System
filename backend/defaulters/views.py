import django_filters
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsAdminUser

from .models import DefaulterStatus
from .serializers import DefaulterStatusListSerializer, DefaulterStatusSerializer
from .services import DefaulterDetectionService


class DefaulterFilter(django_filters.FilterSet):
    """Filters for defaulter listing."""

    classification = django_filters.CharFilter(field_name='classification')
    min_days = django_filters.NumberFilter(field_name='days_overdue', lookup_expr='gte')
    max_days = django_filters.NumberFilter(field_name='days_overdue', lookup_expr='lte')
    member_id = django_filters.CharFilter(field_name='member__member_id', lookup_expr='icontains')
    member_name = django_filters.CharFilter(method='filter_member_name')

    class Meta:
        model = DefaulterStatus
        fields = ['classification', 'days_overdue']

    def filter_member_name(self, queryset, name, value):
        from django.db import models
        return queryset.filter(
            models.Q(member__user__first_name__icontains=value)
            | models.Q(member__user__last_name__icontains=value)
        )


class DefaulterViewSet(viewsets.ReadOnlyModelViewSet):
    """Defaulter management endpoints (admin only)."""

    permission_classes = [IsAdminUser]
    filterset_class = DefaulterFilter
    search_fields = ['member__member_id', 'member__user__first_name', 'member__user__last_name']
    ordering_fields = ['days_overdue', 'classification', 'last_checked']

    def get_queryset(self):
        return DefaulterStatus.objects.select_related(
            'member', 'member__user', 'loan', 'schedule'
        ).all()

    def get_serializer_class(self):
        if self.action == 'list':
            return DefaulterStatusListSerializer
        return DefaulterStatusSerializer

    @action(detail=False, methods=['post'])
    def update_statuses(self, request):
        """Trigger manual update of defaulter statuses."""
        service = DefaulterDetectionService()
        updated = service.update_statuses()
        return Response(
            {'message': f'Updated {updated} defaulter statuses'},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='member/(?P<member_id>[^/.]+)')
    def member_history(self, request, member_id=None):
        """Get defaulter history for a specific member."""
        from members.models import Member

        try:
            member = Member.objects.get(member_id=member_id)
        except Member.DoesNotExist:
            return Response(
                {'error': 'Member not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        statuses = DefaulterStatus.objects.filter(
            member=member
        ).select_related('loan', 'schedule').order_by('-created_at')

        serializer = DefaulterStatusSerializer(statuses, many=True)
        return Response(serializer.data)
