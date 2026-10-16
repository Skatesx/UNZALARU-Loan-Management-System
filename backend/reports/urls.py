from django.urls import path

from . import views

app_name = 'reports'

urlpatterns = [
    path('loans/', views.LoanReportView.as_view(), name='loan-report'),
    path('repayments/', views.RepaymentReportView.as_view(), name='repayment-report'),
    path('defaulters/', views.DefaulterReportView.as_view(), name='defaulter-report'),
    path('eligibility/', views.EligibilityReportView.as_view(), name='eligibility-report'),
    path('membership/', views.MembershipReportView.as_view(), name='membership-report'),
    path('membership/export/<str:format_type>/', views.MembershipReportExportView.as_view(), name='membership-report-export'),
    path('loans/export/<str:format_type>/', views.LoanReportExportView.as_view(), name='loan-report-export'),
    path('repayments/export/<str:format_type>/', views.RepaymentReportExportView.as_view(), name='repayment-report-export'),
]
