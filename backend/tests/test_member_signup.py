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
            'monthly_income': 9000,
        }, content_type='application/json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['membership_status'] == 'PENDING'

        user = User.objects.get(email='newmember@test.com')
        assert user.role == 'MEMBER'
        member = user.member_profile
        assert member.membership_status == 'PENDING'
        assert member.income_verified is False

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
            'monthly_income': 1000,
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
            'monthly_income': 1000,
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
            'monthly_income': 2000,
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
            monthly_income=Decimal('5000'),
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

    def test_admin_can_verify_income(self, auth_client_admin, member):
        """Admin can verify a member's income."""
        response = auth_client_admin.post(
            f'/api/members/{member.id}/verify-income/',
            {'verified_income': '9500.00', 'notes': 'Payslip seen'},
            content_type='application/json',
        )
        assert response.status_code == status.HTTP_200_OK
        member.refresh_from_db()
        assert member.income_verified is True
        assert member.verified_income == Decimal('9500.00')
        assert member.effective_income == Decimal('9500.00')

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

    def test_member_cannot_update_income(self, auth_client_member, member):
        """Member cannot modify their own income via self-update."""
        response = auth_client_member.put(
            '/api/members/update_me/',
            {'monthly_income': 999999},
            content_type='application/json',
        )
        member.refresh_from_db()
        assert member.monthly_income != Decimal('999999')
