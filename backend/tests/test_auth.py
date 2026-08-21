import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


@pytest.mark.django_db
class TestLogin:
    """Test authentication login endpoint."""

    def test_login_success(self, admin_user):
        """Valid login returns JWT tokens."""
        client = APIClient()
        response = client.post('/api/auth/login/', {
            'email': 'admin@test.com',
            'password': 'testpass123',
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_login_invalid_credentials(self, admin_user):
        """Invalid credentials are rejected."""
        client = APIClient()
        response = client.post('/api/auth/login/', {
            'email': 'admin@test.com',
            'password': 'wrongpassword',
        }, format='json')
        # simplejwt returns 400 for validation errors on token endpoint
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_nonexistent_user(self):
        """Non-existent user is rejected."""
        client = APIClient()
        response = client.post('/api/auth/login/', {
            'email': 'nonexistent@test.com',
            'password': 'password',
        }, format='json')
        # simplejwt returns 400 for validation errors on token endpoint
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_missing_fields(self):
        """Missing fields return 400."""
        client = APIClient()
        response = client.post('/api/auth/login/', {
            'email': 'test@test.com',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPasswordChange:
    """Test password change endpoint."""

    def test_password_change_success(self, admin_user):
        """Authenticated user can change password."""
        client = APIClient()
        client.force_authenticate(user=admin_user)
        response = client.post('/api/auth/password-change/', {
            'old_password': 'testpass123',
            'new_password': 'newpassword123',
        }, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_password_change_wrong_old(self, admin_user):
        """Wrong old password is rejected."""
        client = APIClient()
        client.force_authenticate(user=admin_user)
        response = client.post('/api/auth/password-change/', {
            'old_password': 'wrongpassword',
            'new_password': 'newpassword123',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPermissions:
    """Test role-based access control."""

    def test_member_cannot_access_admin_users(self, member_user):
        """Member cannot list users."""
        client = APIClient()
        client.force_authenticate(user=member_user)
        response = client.get('/api/auth/users/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_access_admin_users(self, admin_user):
        """Admin can list users."""
        client = APIClient()
        client.force_authenticate(user=admin_user)
        response = client.get('/api/auth/users/')
        assert response.status_code == status.HTTP_200_OK

    def test_unauthenticated_access_rejected(self):
        """Unauthenticated access is rejected."""
        client = APIClient()
        response = client.get('/api/auth/users/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
