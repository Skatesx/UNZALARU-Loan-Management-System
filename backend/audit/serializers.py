from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for AuditLog model."""

    user_email = serializers.CharField(source='user.email', read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'action', 'entity_type',
            'entity_id', 'description', 'previous_value', 'new_value',
            'ip_address', 'timestamp',
        ]
        read_only_fields = ['id', 'timestamp']
