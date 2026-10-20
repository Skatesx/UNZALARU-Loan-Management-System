import pytest
from rest_framework import status

from members.models import Member


@pytest.mark.django_db
class TestMemberCRUD:
    """Test member CRUD operations."""

    def test_admin_can_list_members(self, auth_client_admin):
        """Admin can list all members."""
        response = auth_client_admin.get('/api/members/')
        assert response.status_code == status.HTTP_200_OK

    def test_member_cannot_list_members(self, auth_client_member):
        """Member cannot list all members."""
        response = auth_client_member.get('/api/members/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_create_member(self, auth_client_admin):
        """Admin can create a new member."""
        response = auth_client_admin.post('/api/members/', {
            'email': 'newmember@test.com',
            'username': 'newmember',
            'first_name': 'New',
            'last_name': 'Member',
            'password': 'testpass123',
            'nrc_number': '100004/14/1',
            'phone_number': '+260700000001',
            'address': '456 Test Road',
            'school': 'School of Natural Sciences',
            'department': 'Mathematics and Statistics',
            'employment_status': 'PERMANENT',
            'member_id': '456780',
        }, content_type='application/json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Member.objects.get(nrc_number='100004/14/1').member_id == '456780'

    def test_member_list_shows_application_count(
        self, auth_client_admin, member, loan_type
    ):
        """Each member's number of loan applications is listed (cancelled excluded)."""
        from loans.models import LoanApplication

        for status_value in ['PENDING', 'REJECTED', 'CANCELLED']:
            LoanApplication.objects.create(
                member=member, loan_type=loan_type, requested_amount=5000,
                duration_months=6, purpose='Test', status=status_value,
            )
        response = auth_client_admin.get('/api/members/')
        row = next(r for r in response.data['results'] if r['id'] == member.id)
        assert row['application_count'] == 2
        assert 'monthly_income' not in row

    def test_admin_can_get_member_detail(self, auth_client_admin, member):
        """Admin can view member details."""
        response = auth_client_admin.get(f'/api/members/{member.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['member_id'] == member.member_id

    def test_admin_can_update_member(self, auth_client_admin, member):
        """Admin can update member information."""
        response = auth_client_admin.patch(
            f'/api/members/{member.id}/',
            {'phone_number': '+260700000999'},
            content_type='application/json'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_member_search(self, auth_client_admin, member):
        """Admin can search members."""
        response = auth_client_admin.get('/api/members/', {'search': 'Member'})
        assert response.status_code == status.HTTP_200_OK
