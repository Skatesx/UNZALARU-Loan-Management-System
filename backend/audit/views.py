import django_filters
from rest_framework import viewsets

from users.permissions import IsAdminUser

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogFilter(django_filters.FilterSet):
    """Filters for audit log listing."""

    action = django_filters.CharFilter(field_name='action')
    entity_type = django_filters.CharFilter(field_name='entity_type')
    user_email = django_filters.CharFilter(field_name='user__email', lookup_expr='icontains')
    timestamp_after = django_filters.DateTimeFilter(field_name='timestamp', lookup_expr='gte')
    timestamp_before = django_filters.DateTimeFilter(field_name='timestamp', lookup_expr='lte')

    class Meta:
        model = AuditLog
        fields = ['action', 'entity_type', 'user']


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Audit log endpoints (admin only)."""

    permission_classes = [IsAdminUser]
    queryset = AuditLog.objects.select_related('user').all()
    serializer_class = AuditLogSerializer
    filterset_class = AuditLogFilter
    search_fields = ['description', 'entity_id']
    ordering_fields = ['timestamp', 'action']
