from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .payroll_views import (
    PayrollConfirmView,
    PayrollDeductionExportView,
    PayrollDeductionListView,
    PayrollReturnMatchView,
)
from .views import RepaymentViewSet

app_name = 'repayments'

router = DefaultRouter()
router.register('repayments', RepaymentViewSet, basename='repayment')

urlpatterns = [
    # Monthly salary deductions
    path('payroll/deductions/', PayrollDeductionListView.as_view(), name='payroll-deductions'),
    path('payroll/deductions/export/<str:format_type>/', PayrollDeductionExportView.as_view(),
         name='payroll-deductions-export'),
    path('payroll/deductions/match/', PayrollReturnMatchView.as_view(), name='payroll-return-match'),
    path('payroll/deductions/confirm/', PayrollConfirmView.as_view(), name='payroll-confirm'),
    path('', include(router.urls)),
]
