from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from eligibility.models import EligibilityRule
from eligibility.serializers import EligibilityRuleSerializer
from loans.models import LoanType
from loans.serializers import LoanTypeSerializer
from users.permissions import IsAdminUser

from .models import SystemConfig
from .serializers import SystemConfigSerializer


class LoanTypeConfigViewSet(viewsets.ModelViewSet):
    """Loan type configuration endpoints (admin only)."""

    permission_classes = [IsAdminUser]
    queryset = LoanType.objects.all()
    serializer_class = LoanTypeSerializer
    search_fields = ['name']
    filterset_fields = ['is_active']


class EligibilityRuleConfigViewSet(viewsets.ModelViewSet):
    """Eligibility rule configuration endpoints (admin only)."""

    permission_classes = [IsAdminUser]
    queryset = EligibilityRule.objects.all()
    serializer_class = EligibilityRuleSerializer
    search_fields = ['name', 'factor']
    filterset_fields = ['factor', 'is_active']


class SystemConfigView(APIView):
    """System configuration endpoints (admin only)."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        configs = SystemConfig.objects.all()
        serializer = SystemConfigSerializer(configs, many=True)
        return Response(serializer.data)

    def put(self, request):
        """Update or create system configuration."""
        configs = request.data.get('configs', [])

        updated = []
        for config_data in configs:
            key = config_data.get('key')
            value = config_data.get('value')
            description = config_data.get('description', '')

            if not key or value is None:
                continue

            config, created = SystemConfig.objects.update_or_create(
                key=key,
                defaults={'value': value, 'description': description}
            )
            updated.append(SystemConfigSerializer(config).data)

        return Response(updated, status=status.HTTP_200_OK)
