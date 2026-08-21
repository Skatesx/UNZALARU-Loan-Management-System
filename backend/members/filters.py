import django_filters
from django.db import models

from .models import Member


class MemberFilter(django_filters.FilterSet):
    """Filters for member listing."""

    name = django_filters.CharFilter(method='filter_name')
    date_joined_after = django_filters.DateFilter(
        field_name='date_joined', lookup_expr='gte'
    )
    date_joined_before = django_filters.DateFilter(
        field_name='date_joined', lookup_expr='lte'
    )
    min_income = django_filters.NumberFilter(
        field_name='monthly_income', lookup_expr='gte'
    )
    max_income = django_filters.NumberFilter(
        field_name='monthly_income', lookup_expr='lte'
    )

    class Meta:
        model = Member
        fields = [
            'department', 'employment_status', 'membership_status',
            'account_status',
        ]

    def filter_name(self, queryset, name, value):
        return queryset.filter(
            models.Q(user__first_name__icontains=value)
            | models.Q(user__last_name__icontains=value)
            | models.Q(user__email__icontains=value)
        )
