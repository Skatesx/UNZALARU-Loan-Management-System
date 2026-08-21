from rest_framework import serializers

from .models import DefaulterStatus


class DefaulterStatusSerializer(serializers.ModelSerializer):
    """Serializer for DefaulterStatus model."""

    member_name = serializers.CharField(source='member.user.get_full_name', read_only=True)
    member_id = serializers.CharField(source='member.member_id', read_only=True)
    member_email = serializers.CharField(source='member.user.email', read_only=True)
    member_phone = serializers.CharField(source='member.phone_number', read_only=True)
    loan_id = serializers.CharField(source='loan.loan_id', read_only=True)
    loan_amount = serializers.DecimalField(
        source='loan.principal', max_digits=12, decimal_places=2, read_only=True
    )
    outstanding_amount = serializers.DecimalField(
        source='loan.outstanding_balance', max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = DefaulterStatus
        fields = [
            'id', 'member', 'member_name', 'member_id', 'member_email',
            'member_phone', 'loan', 'loan_id', 'loan_amount',
            'outstanding_amount', 'schedule', 'days_overdue',
            'classification', 'last_checked', 'created_at',
        ]
        read_only_fields = ['id', 'last_checked', 'created_at']


class DefaulterStatusListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for defaulter lists."""

    member_name = serializers.CharField(source='member.user.get_full_name', read_only=True)
    member_id = serializers.CharField(source='member.member_id', read_only=True)
    loan_id = serializers.CharField(source='loan.loan_id', read_only=True)

    class Meta:
        model = DefaulterStatus
        fields = [
            'id', 'member_name', 'member_id', 'loan_id',
            'days_overdue', 'classification', 'last_checked',
        ]
