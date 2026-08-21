from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import RepaymentViewSet

app_name = 'repayments'

router = DefaultRouter()
router.register('repayments', RepaymentViewSet, basename='repayment')

urlpatterns = [
    path('', include(router.urls)),
]
