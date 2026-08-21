from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EligibilityRuleConfigViewSet, LoanTypeConfigViewSet, SystemConfigView

app_name = 'config_app'

router = DefaultRouter()
router.register('loan-types', LoanTypeConfigViewSet, basename='loan-type-config')
router.register('eligibility-rules', EligibilityRuleConfigViewSet, basename='eligibility-rule-config')

urlpatterns = [
    path('', include(router.urls)),
    path('system/', SystemConfigView.as_view(), name='system-config'),
]
