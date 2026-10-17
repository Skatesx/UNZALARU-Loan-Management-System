from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = 'users'

urlpatterns = [
    # Authentication
    path('login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.LogoutView.as_view(), name='logout'),

    # Password management
    path('password-change/', views.PasswordChangeView.as_view(), name='password_change'),
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # User management (admin only)
    path('users/', views.UserListCreateView.as_view(), name='user_list_create'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('users/<int:pk>/reset-password/', views.AdminResetPasswordView.as_view(),
         name='user_reset_password'),
    path('staff/', views.StaffListCreateView.as_view(), name='staff_list_create'),
    path('staff/<int:pk>/', views.StaffDetailView.as_view(), name='staff_detail'),
]
