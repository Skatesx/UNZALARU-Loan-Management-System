from rest_framework import serializers


class LoanReportSerializer(serializers.Serializer):
    """Serializer for loan report data."""

    loan_id = serializers.CharField()
    member_name = serializers.CharField()
    member_id = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    interest = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_repayment = serializers.DecimalField(max_digits=12, decimal_places=2)
    duration = serializers.IntegerField()
    status = serializers.CharField()
    date_approved = serializers.DateTimeField()


class RepaymentReportSerializer(serializers.Serializer):
    """Serializer for repayment report data."""

    member_name = serializers.CharField()
    member_id = serializers.CharField()
    loan_id = serializers.CharField()
    expected_payment = serializers.DecimalField(max_digits=12, decimal_places=2)
    actual_payment = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_date = serializers.DateTimeField()
    outstanding_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    status = serializers.CharField()


class DefaulterReportSerializer(serializers.Serializer):
    """Serializer for defaulter report data."""

    member_name = serializers.CharField()
    member_id = serializers.CharField()
    loan_id = serializers.CharField()
    amount_overdue = serializers.DecimalField(max_digits=12, decimal_places=2)
    days_overdue = serializers.IntegerField()
    classification = serializers.CharField()


class EligibilityReportSerializer(serializers.Serializer):
    """Serializer for eligibility report data."""

    member_name = serializers.CharField()
    member_id = serializers.CharField()
    application_id = serializers.CharField()
    eligibility_score = serializers.DecimalField(max_digits=5, decimal_places=2)
    score_breakdown = serializers.DictField()
    recommendation = serializers.CharField()
    final_decision = serializers.CharField()
