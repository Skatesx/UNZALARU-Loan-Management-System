from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LoanApplicationViewSet, LoanTypeViewSet, LoanViewSet

app_name = 'loans'

router = DefaultRouter()
router.register('loan-types', LoanTypeViewSet, basename='loantype')
router.register('loan-applications', LoanApplicationViewSet, basename='loanapplication')
router.register('loans', LoanViewSet, basename='loan')

urlpatterns = [
    path('', include(router.urls)),
]
