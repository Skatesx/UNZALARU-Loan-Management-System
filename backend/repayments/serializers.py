from rest_framework import serializers

from .models import Repayment, RepaymentSchedule


class RepaymentScheduleSerializer(serializers.ModelSerializer):
    """Serializer for RepaymentSchedule model."""

    loan_id = serializers.CharField(source='loan.loan_id', read_only=True)

    class Meta:
        model = RepaymentSchedule
        fields = [
            'id', 'installment_id', 'loan', 'loan_id', 'installment_number',
            'due_date', 'expected_amount', 'amount_paid', 'remaining_amount',
            'payment_status', 'days_overdue', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'installment_id', 'amount_paid', 'remaining_amount',
            'payment_status', 'days_overdue', 'created_at', 'updated_at',
        ]


class RepaymentSerializer(serializers.ModelSerializer):
    """Serializer for Repayment model."""

    loan_id = serializers.CharField(source='loan.loan_id', read_only=True)
    installment_number = serializers.IntegerField(
        source='schedule.installment_number', read_only=True
    )
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Repayment
        fields = [
            'id', 'repayment_id', 'loan', 'loan_id', 'schedule',
            'installment_number', 'amount', 'payment_date', 'recorded_by',
            'recorded_by_name', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'repayment_id', 'payment_date', 'created_at']

    def get_recorded_by_name(self, obj):
        if obj.recorded_by:
            return obj.recorded_by.get_full_name()
        return None


class RepaymentCreateSerializer(serializers.Serializer):
    """Serializer for recording a repayment."""

    loan_id = serializers.CharField(required=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    schedule_id = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
