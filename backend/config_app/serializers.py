from rest_framework import serializers

from loans.models import LoanType
from loans.serializers import LoanTypeSerializer

from .models import SystemConfig


class SystemConfigSerializer(serializers.ModelSerializer):
    """Serializer for SystemConfig model."""

    class Meta:
        model = SystemConfig
        fields = ['id', 'key', 'value', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
