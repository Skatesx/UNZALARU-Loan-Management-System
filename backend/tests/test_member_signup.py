"""Tests for member signup, pending membership, and approval workflow."""
import pytest
from decimal import Decimal
from rest_framework import status
from rest_framework.test import APIClient

from members.models import Member
from users.models import User


@pytest.fixture
def api_client():
    """Unauthenticated API client."""
    return APIClient()


@pytest.mark.django_db
class TestMemberSignup:
    """Test public member self-registration."""

    def test_signup_creates_pending_member(self, api_client):
        """Signup creates a MEMBER user with PENDING membership."""
        response = api_client.post('/api/members/signup/', {
            'email': 'newmember@test.com',
            'first_name': 'New',
            'last_name': 'Member',
            'password': 'securepass123',
            'nrc_number': 'NRC-NEW-001',
            'phone_number': '+260700123456',
            'address': '789 New Road, Lusaka',
            'department': 'Physics',
            'employment_status': 'PERMANENT',
            'member_id': '20001',
        }, content_type='application/json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['membership_status'] == 'PENDING'

        user = User.objects.get(email='newmember@test.com')
        assert user.role == 'MEMBER'
        member = user.member_profile
        assert member.membership_status == 'PENDING'
        assert member.member_id == '20001'
        assert response.data['member_id'] == '20001'

    def test_signup_duplicate_email_rejected(self, api_client, member_user):
        """Signup with an existing email is rejected."""
        response = api_client.post('/api/members/signup/', {
            'email': member_user.email,
            'first_name': 'X',
            'last_name': 'Y',
            'password': 'securepass123',
            'nrc_number': 'NRC-DUP-1',
            'phone_number': '+260700000000',
            'address': 'A',
            'department': 'B',
            'employment_status': 'PERMANENT',
            'member_id': '20002',
        }, content_type='application/json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_signup_duplicate_nrc_rejected(self, api_client):
        """Signup with an existing NRC number is rejected."""
        # First signup
        api_client.post('/api/members/signup/', {
            'email': 'first@test.com',
            'first_name': 'First',
            'last_name': 'User',
            'password': 'securepass123',
            'nrc_number': 'NRC-SAME-123',
            'phone_number': '+260700111111',
            'address': 'A',
            'department': 'B',
            'employment_status': 'PERMANENT',
            'member_id': '20003',
        }, content_type='application/json')
        # Second signup with same NRC
        response = api_client.post('/api/members/signup/', {
            'email': 'second@test.com',
            'first_name': 'Second',
            'last_name': 'User',
            'password': 'securepass123',
            'nrc_number': 'NRC-SAME-123',
            'phone_number': '+260700222222',
            'address': 'C',
            'department': 'D',
            'employment_status': 'PERMANENT',
            'member_id': '20004',
        }, content_type='application/json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPendingMemberRestrictions:
    """Test that pending members are restricted."""

    def test_pending_member_cannot_apply(self, pending_member, loan_type, eligibility_rules):
        """Pending member cannot submit a loan application."""
        from loans.services import LoanApplicationService

        service = LoanApplicationService()
        with pytest.raises(ValueError, match='pending approval'):
            service.create_application(
                member=pending_member,
                loan_type=loan_type,
                requested_amount=Decimal('5000'),
                duration_months=6,
                purpose='Test loan',
            )

    def test_pending_member_can_sign_in(self, api_client):
        """Pending member can still authenticate (limited access)."""
        # Create user + pending profile
        user = User.objects.create_user(
            email='canlogin@test.com',
            username='canlogin',
            password='testpass123',
            first_name='Can',
            last_name='Login',
            role='MEMBER',
        )
        Member.objects.create(
            user=user,
            nrc_number='NRC-CANLOGIN',
            phone_number='+260700999999',
            address='1 Test St',
            department='Law',
            employment_status='CONTRACT',
            member_id='20099',
            membership_status='PENDING',
        )

        response = api_client.post('/api/auth/login/', {
            'email': 'canlogin@test.com',
            'password': 'testpass123',
        }, content_type='application/json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data


@pytest.mark.django_db
class TestMemberApproval:
    """Test admin approval of pending members."""

    def test_admin_can_approve_pending_member(
        self, auth_client_admin, pending_member
    ):
        """Admin can approve a pending member."""
        response = auth_client_admin.post(
            f'/api/members/{pending_member.id}/approve/'
        )
        assert response.status_code == status.HTTP_200_OK
        pending_member.refresh_from_db()
        assert pending_member.membership_status == 'ACTIVE'
        assert pending_member.approved_by is not None
        assert pending_member.approval_date is not None

    def test_admin_can_reject_pending_member(
        self, auth_client_admin, pending_member
    ):
        """Admin can reject a pending member (deactivates the account)."""
        response = auth_client_admin.post(
            f'/api/members/{pending_member.id}/reject/',
            {'reason': 'Duplicate registration'},
            content_type='application/json',
        )
        assert response.status_code == status.HTTP_200_OK
        pending_member.refresh_from_db()
        assert pending_member.membership_status == 'INACTIVE'
        assert pending_member.user.is_active is False

    def test_member_cannot_approve(self, auth_client_member, member, pending_member):
        """Regular members cannot access the approval endpoint."""
        response = auth_client_member.post(
            f'/api/members/{pending_member.id}/approve/'
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_me_endpoint(self, auth_client_member, member):
        """Member can fetch their own profile via /members/me/."""
        response = auth_client_member.get('/api/members/me/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['member_id'] == member.member_id

    def test_member_can_update_own_contact(self, auth_client_member, member):
        """Member can update their own phone/address."""
        response = auth_client_member.put(
            '/api/members/update_me/',
            {'phone_number': '+260711111111', 'address': '2 Updated St'},
            content_type='application/json',
        )
        assert response.status_code == status.HTTP_200_OK
        member.refresh_from_db()
        assert member.phone_number == '+260711111111'
        assert member.address == '2 Updated St'

    def test_member_cannot_change_own_man_number(self, auth_client_member, member):
        """Self-update only changes contact details, not the MAN number."""
        auth_client_member.put(
            '/api/members/update_me/',
            {'member_id': '99999'},
            content_type='application/json',
        )
        member.refresh_from_db()
        assert member.member_id == '10001'


@pytest.mark.django_db
class TestManNumbers:
    """MAN numbers are entered at signup and identify the member."""

    def _signup(self, api_client, email, nrc, man):
        return api_client.post('/api/members/signup/', {
            'member_id': man,
            'email': email,
            'first_name': 'Man',
            'last_name': 'Number',
            'password': 'securepass123',
            'nrc_number': nrc,
            'phone_number': '+260700555555',
            'address': 'A',
            'department': 'B',
            'employment_status': 'PERMANENT',
        }, content_type='application/json')

    def test_man_number_required(self, api_client):
        response = api_client.post('/api/members/signup/', {
            'email': 'noman@test.com',
            'first_name': 'No',
            'last_name': 'Man',
            'password': 'securepass123',
            'nrc_number': 'NRC-NOMAN',
            'phone_number': '+260700555555',
            'address': 'A',
            'department': 'B',
            'employment_status': 'PERMANENT',
        }, content_type='application/json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'member_id' in response.data

    def test_duplicate_man_number_rejected(self, api_client, member):
        response = self._signup(api_client, 'dupman@test.com', 'NRC-DUPMAN', member.member_id)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'member_id' in response.data

    def test_invalid_man_number_rejected(self, api_client):
        response = self._signup(api_client, 'badman@test.com', 'NRC-BADMAN', 'a b!')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_man_number_is_normalised(self, api_client):
        response = self._signup(api_client, 'lower@test.com', 'NRC-LOWER', ' ab123 ')
        assert response.status_code == status.HTTP_201_CREATED
        assert Member.objects.get(user__email='lower@test.com').member_id == 'AB123'
