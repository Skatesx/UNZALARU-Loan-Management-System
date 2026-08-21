from rest_framework import serializers

from .models import EligibilityRule, EligibilityScore


class EligibilityRuleSerializer(serializers.ModelSerializer):
    """Serializer for EligibilityRule model."""

    class Meta:
        model = EligibilityRule
        fields = [
            'id', 'name', 'factor', 'weight', 'thresholds',
            'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class EligibilityScoreSerializer(serializers.ModelSerializer):
    """Serializer for EligibilityScore model."""

    application_id = serializers.CharField(
        source='application.application_id', read_only=True
    )
    member_name = serializers.SerializerMethodField()

    class Meta:
        model = EligibilityScore
        fields = [
            'id', 'application', 'application_id', 'member_name',
            'total_score', 'breakdown', 'recommendation', 'reasons',
            'calculated_at',
        ]
        read_only_fields = ['id', 'calculated_at']

    def get_member_name(self, obj):
        return obj.application.member.user.get_full_name()


class EligibilityScoreListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for eligibility score lists."""

    application_id = serializers.CharField(
        source='application.application_id', read_only=True
    )
    member_name = serializers.SerializerMethodField()

    class Meta:
        model = EligibilityScore
        fields = [
            'id', 'application_id', 'member_name', 'total_score',
            'recommendation', 'calculated_at',
        ]

    def get_member_name(self, obj):
        return obj.application.member.user.get_full_name()
