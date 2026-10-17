"""Staff accounts, forgot-password emails, and admin password resets."""
import re

import pytest
from django.core import mail
from rest_framework import status
from rest_framework.test import APIClient

from audit.models import AuditLog
from users.models import User


def login(email, password):
    return APIClient().post('/api/auth/login/', {'email': email, 'password': password}, format='json')


@pytest.fixture
def supervisor(db):
    return User.objects.create_user(
        email='sup@test.com', username='sup', password='testpass123',
        first_name='Sup', last_name='Visor', role='SUPERVISOR',
    )


@pytest.mark.django_db
class TestStaffAccounts:
    def test_admin_adds_supervisor_with_temporary_password(self, auth_client_admin):
        response = auth_client_admin.post('/api/auth/staff/', {
            'email': 'new.officer@unzalaru.com', 'first_name': 'New',
            'last_name': 'Officer', 'role': 'SUPERVISOR',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data['role'] == 'SUPERVISOR'
        assert login('new.officer@unzalaru.com', data['temporary_password']).status_code == 200
        assert AuditLog.objects.filter(action='STAFF_CREATED').exists()

    def test_can_add_another_admin(self, auth_client_admin):
        response = auth_client_admin.post('/api/auth/staff/', {
            'email': 'second.admin@unzalaru.com', 'first_name': 'Second',
            'last_name': 'Admin', 'role': 'ADMIN',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(role='ADMIN').count() == 2

    def test_cannot_create_member_accounts_here(self, auth_client_admin):
        response = auth_client_admin.post('/api/auth/staff/', {
            'email': 'x@unzalaru.com', 'first_name': 'X', 'last_name': 'Y', 'role': 'MEMBER',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_duplicate_email_rejected(self, auth_client_admin, admin_user):
        response = auth_client_admin.post('/api/auth/staff/', {
            'email': admin_user.email.upper(), 'first_name': 'X', 'last_name': 'Y', 'role': 'ADMIN',
        }, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_list_shows_only_staff(self, auth_client_admin, admin_user, supervisor, member):
        emails = {u['email'] for u in auth_client_admin.get('/api/auth/staff/').json()['results']}
        assert emails == {admin_user.email, supervisor.email}

    def test_deactivate_and_change_role(self, auth_client_admin, supervisor):
        url = f'/api/auth/staff/{supervisor.id}/'
        assert auth_client_admin.patch(url, {'is_active': False}, format='json').status_code == 200
        assert login(supervisor.email, 'testpass123').status_code == 400
        response = auth_client_admin.patch(url, {'is_active': True, 'role': 'ADMIN'}, format='json')
        supervisor.refresh_from_db()
        assert response.status_code == 200 and supervisor.role == 'ADMIN' and supervisor.is_active

    def test_admin_cannot_lock_themselves_out(self, auth_client_admin, admin_user, supervisor):
        url = f'/api/auth/staff/{admin_user.id}/'
        assert auth_client_admin.patch(url, {'is_active': False}, format='json').status_code == 400
        assert auth_client_admin.patch(url, {'role': 'SUPERVISOR'}, format='json').status_code == 400

    def test_demoting_one_of_two_admins_is_fine(self, auth_client_admin):
        other = User.objects.create_user(
            email='other@test.com', username='other', password='testpass123',
            first_name='O', last_name='A', role='ADMIN',
        )
        response = auth_client_admin.patch(
            f'/api/auth/staff/{other.id}/', {'role': 'SUPERVISOR'}, format='json'
        )
        assert response.status_code == 200

    def test_last_active_admin_is_kept(self, admin_user):
        # Another admin whose account is already switched off tries to
        # deactivate the only active admin
        inactive_admin = User.objects.create_user(
            email='old@test.com', username='old', password='testpass123',
            first_name='O', last_name='A', role='ADMIN', is_active=False,
        )
        client = APIClient()
        client.force_authenticate(inactive_admin)
        response = client.patch(
            f'/api/auth/staff/{admin_user.id}/', {'is_active': False}, format='json'
        )
        assert response.status_code == 400
        assert 'at least one active admin' in response.json()['error']

    def test_members_cannot_be_edited_through_staff_api(self, auth_client_admin, member):
        response = auth_client_admin.patch(
            f'/api/auth/staff/{member.user.id}/', {'role': 'ADMIN'}, format='json'
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_supervisors_cannot_manage_staff(self, supervisor):
        client = APIClient()
        client.force_authenticate(supervisor)
        assert client.get('/api/auth/staff/').status_code == 403

    def test_old_user_endpoints_are_read_only(self, auth_client_admin, member):
        url = f'/api/auth/users/{member.user.id}/'
        assert auth_client_admin.delete(url).status_code == 405
        assert auth_client_admin.patch(url, {'role': 'ADMIN'}, format='json').status_code == 405
        assert auth_client_admin.post('/api/auth/users/', {}, format='json').status_code == 405


@pytest.mark.django_db
class TestForgotPassword:
    def _link(self):
        body = mail.outbox[-1].body
        uid, token = re.search(r'uid=([^&\s]+)&token=(\S+)', body).groups()
        return uid, token

    def test_reset_link_emailed_and_works_once(self, member_user):
        client = APIClient()
        response = client.post('/api/auth/password-reset/', {'email': member_user.email}, format='json')
        assert response.status_code == 200
        assert len(mail.outbox) == 1 and mail.outbox[0].to == [member_user.email]
        uid, token = self._link()

        confirm = {'uid': uid, 'token': token, 'new_password': 'BrandNew!2026'}
        assert client.post('/api/auth/password-reset/confirm/', confirm, format='json').status_code == 200
        assert login(member_user.email, 'BrandNew!2026').status_code == 200
        # Using the same link again fails
        again = client.post('/api/auth/password-reset/confirm/', {**confirm, 'new_password': 'Another!2026'}, format='json')
        assert again.status_code == 400

    def test_unknown_email_gets_same_answer_and_no_email(self, db):
        response = APIClient().post('/api/auth/password-reset/', {'email': 'nobody@test.com'}, format='json')
        assert response.status_code == 200
        assert len(mail.outbox) == 0

    def test_bad_token_rejected(self, member_user):
        APIClient().post('/api/auth/password-reset/', {'email': member_user.email}, format='json')
        uid, _ = self._link()
        response = APIClient().post('/api/auth/password-reset/confirm/', {
            'uid': uid, 'token': 'wrong-token', 'new_password': 'BrandNew!2026',
        }, format='json')
        assert response.status_code == 400
        assert login(member_user.email, 'testpass123').status_code == 200

    def test_weak_password_rejected(self, member_user):
        APIClient().post('/api/auth/password-reset/', {'email': member_user.email}, format='json')
        uid, token = self._link()
        response = APIClient().post('/api/auth/password-reset/confirm/', {
            'uid': uid, 'token': token, 'new_password': '12345678',
        }, format='json')
        assert response.status_code == 400


@pytest.mark.django_db
class TestAdminPasswordReset:
    def test_admin_sets_temporary_password(self, auth_client_admin, member_user):
        response = auth_client_admin.post(f'/api/auth/users/{member_user.id}/reset-password/')
        assert response.status_code == 200
        temp = response.json()['temporary_password']
        assert len(temp) == 10
        assert login(member_user.email, temp).status_code == 200
        assert login(member_user.email, 'testpass123').status_code == 400
        assert AuditLog.objects.filter(action='PASSWORD_RESET_BY_ADMIN').exists()

    def test_only_admins(self, auth_client_member, member_user):
        response = auth_client_member.post(f'/api/auth/users/{member_user.id}/reset-password/')
        assert response.status_code == 403
