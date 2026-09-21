from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MemberSignupView, MemberViewSet

app_name = 'members'

router = DefaultRouter()
router.register('', MemberViewSet, basename='member')

urlpatterns = [
    # Public self-registration (no auth)
    path('signup/', MemberSignupView.as_view(), name='member-signup'),
    path('', include(router.urls)),
]
