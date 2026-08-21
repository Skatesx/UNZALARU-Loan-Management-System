from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AuditLogViewSet

app_name = 'audit'

router = DefaultRouter()
router.register('', AuditLogViewSet, basename='auditlog')

urlpatterns = [
    path('', include(router.urls)),
]
