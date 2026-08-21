from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),

    # Authentication & Users
    path('api/auth/', include('users.urls')),

    # Members
    path('api/members/', include('members.urls')),

    # Loans
    path('api/', include('loans.urls')),

    # Eligibility
    path('api/eligibility/', include('eligibility.urls')),

    # Repayments
    path('api/', include('repayments.urls')),

    # Defaulters
    path('api/defaulters/', include('defaulters.urls')),

    # Reports
    path('api/reports/', include('reports.urls')),

    # Dashboard
    path('api/dashboard/', include('reports.urls_dashboard')),

    # Notifications
    path('api/notifications/', include('notifications.urls')),

    # Audit
    path('api/audit/', include('audit.urls')),

    # Admin Config
    path('api/admin/config/', include('config_app.urls')),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
