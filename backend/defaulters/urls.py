from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DefaulterViewSet

app_name = 'defaulters'

router = DefaultRouter()
router.register('', DefaulterViewSet, basename='defaulter')

urlpatterns = [
    path('', include(router.urls)),
]
