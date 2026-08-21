from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EligibilityRuleViewSet, EligibilityScoreViewSet

app_name = 'eligibility'

router = DefaultRouter()
router.register('rules', EligibilityRuleViewSet, basename='eligibilityrule')
router.register('scores', EligibilityScoreViewSet, basename='eligibilityscore')

urlpatterns = [
    path('', include(router.urls)),
]
