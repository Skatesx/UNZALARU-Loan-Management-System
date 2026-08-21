from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MemberViewSet

app_name = 'members'

router = DefaultRouter()
router.register('', MemberViewSet, basename='member')

urlpatterns = [
    path('', include(router.urls)),
]
