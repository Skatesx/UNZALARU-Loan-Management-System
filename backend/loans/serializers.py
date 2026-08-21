from rest_framework import serializers

from members.serializers import MemberListSerializer

from .models import Loan, LoanApplication, LoanType


class LoanTypeSerializer(serializers.ModelSerializer):
    """Serializer for LoanType model."""

    class Meta:
        model = LoanType
        fields = [
            'id', 'name', 'description', 'min_amount', 'max_amount',
            'min_duration_months', 'max_duration_months', 'interest_rate',
            'interest_method', 'allow_multiple_active', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LoanApplicationSerializer(serializers.ModelSerializer):
    """Full serializer for LoanApplication."""

    member = MemberListSerializer(read_only=True)
    loan_type_name = serializers.CharField(source='loan_type.name', read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LoanApplication
        fields = [
            'id', 'application_id', 'member', 'loan_type', 'loan_type_name',
            'requested_amount', 'duration_months', 'purpose',
            'application_date', 'current_employment_info', 'income_info',
            'existing_loan_obligations', 'status', 'rejection_reason',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'application_id', 'application_date', 'status',
            'rejection_reason', 'reviewed_by', 'reviewed_at',
            'created_at', 'updated_at',
        ]

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name()
        return None


class LoanApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating loan applications."""

    class Meta:
        model = LoanApplication
        fields = [
            'loan_type', 'requested_amount', 'duration_months', 'purpose',
            'current_employment_info', 'income_info', 'existing_loan_obligations',
        ]


class LoanApplicationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for application lists."""

    member_name = serializers.CharField(source='member.user.get_full_name', read_only=True)
    member_id = serializers.CharField(source='member.member_id', read_only=True)
    loan_type_name = serializers.CharField(source='loan_type.name', read_only=True)

    class Meta:
        model = LoanApplication
        fields = [
            'id', 'application_id', 'member_name', 'member_id',
            'loan_type', 'loan_type_name', 'requested_amount',
            'duration_months', 'status', 'application_date',
        ]


class LoanSerializer(serializers.ModelSerializer):
    """Full serializer for Loan model."""

    member = MemberListSerializer(read_only=True)
    loan_type_name = serializers.CharField(source='loan_type.name', read_only=True)
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Loan
        fields = [
            'id', 'loan_id', 'application', 'member', 'loan_type',
            'loan_type_name', 'principal', 'interest_rate', 'interest_method',
            'total_interest', 'total_repayment', 'duration_months',
            'monthly_installment', 'amount_repaid', 'outstanding_balance',
            'status', 'date_approved', 'approved_by', 'approved_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'loan_id', 'date_approved', 'created_at', 'updated_at',
        ]

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name()
        return None


class LoanListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for loan lists."""

    member_name = serializers.CharField(source='member.user.get_full_name', read_only=True)
    member_id = serializers.CharField(source='member.member_id', read_only=True)
    loan_type_name = serializers.CharField(source='loan_type.name', read_only=True)

    class Meta:
        model = Loan
        fields = [
            'id', 'loan_id', 'member_name', 'member_id', 'loan_type_name',
            'principal', 'total_repayment', 'amount_repaid',
            'outstanding_balance', 'status', 'date_approved',
        ]


class ApproveApplicationSerializer(serializers.Serializer):
    """Serializer for approving an application."""

    pass  # No additional fields needed for approval


class RejectApplicationSerializer(serializers.Serializer):
    """Serializer for rejecting an application."""

    reason = serializers.CharField(required=True, allow_blank=False)
