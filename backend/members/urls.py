from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MemberSignupView, MemberViewSet, SchoolListView

app_name = 'members'

router = DefaultRouter()
router.register('', MemberViewSet, basename='member')

urlpatterns = [
    # Public self-registration (no auth)
    path('signup/', MemberSignupView.as_view(), name='member-signup'),
    # Schools/faculties and departments entered by members (report filters)
    path('schools/', SchoolListView.as_view(), name='member-schools'),
    path('', include(router.urls)),
]
