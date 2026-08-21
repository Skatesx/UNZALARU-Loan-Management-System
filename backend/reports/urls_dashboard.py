from django.urls import path

from . import views

app_name = 'dashboard'

urlpatterns = [
    path('admin/summary/', views.AdminDashboardSummaryView.as_view(), name='admin-summary'),
    path('admin/charts/<str:chart_type>/', views.AdminDashboardChartsView.as_view(), name='admin-charts'),
    path('member/', views.MemberDashboardView.as_view(), name='member-dashboard'),
]
