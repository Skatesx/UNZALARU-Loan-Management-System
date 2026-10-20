"""Single flat loan product, schools from departments, and the membership report."""
from decimal import Decimal

import pytest
from rest_framework import status

from loans.models import LoanType
from loans.services import LoanApplicationService, LoanCalculationService
from members.models import Member


@pytest.fixture
def flat_loan(db):
    LoanType.objects.update(is_active=False)
    return LoanType.objects.create(
        name='Flat Loan',
        description='Members qualify by membership',
        min_amount=Decimal('10000'),
        max_amount=Decimal('20000'),
        allowed_amounts=[10000, 15000, 20000],
        min_duration_months=1,
        max_duration_months=12,
        interest_rate=Decimal('10'),
        interest_method='FLAT_ONCE',
    )


@pytest.mark.django_db
class TestFlatLoan:
    @pytest.mark.parametrize('months', [1, 6, 12])
    def test_interest_is_ten_percent_once(self, months):
        details = LoanCalculationService().calculate_loan(
            principal=Decimal('15000'), annual_rate=Decimal('10'),
            months=months, interest_method='FLAT_ONCE',
        )
        assert details['total_interest'] == Decimal('1500.00')
        assert details['total_repayment'] == Decimal('16500.00')

    def test_only_fixed_amounts_allowed(self, member, flat_loan, eligibility_rules):
        with pytest.raises(ValueError, match='must be one of: K10,000, K15,000, K20,000'):
            LoanApplicationService().create_application(
                member=member, loan_type=flat_loan, requested_amount=Decimal('12000'),
                duration_months=6, purpose='Test loan',
            )

    def test_duration_limited_to_twelve_months(self, member, flat_loan, eligibility_rules):
        with pytest.raises(ValueError, match='Maximum duration is 12 months'):
            LoanApplicationService().create_application(
                member=member, loan_type=flat_loan, requested_amount=Decimal('10000'),
                duration_months=13, purpose='Test loan',
            )

    def test_member_applies_without_choosing_a_type(
        self, auth_client_member, member, flat_loan, eligibility_rules
    ):
        response = auth_client_member.post('/api/loan-applications/', {
            'requested_amount': 20000,
            'duration_months': 10,
            'purpose': 'School fees for the term',
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert member.applications.get().loan_type == flat_loan

    def test_approved_flat_loan_schedule(self, admin_user, member, flat_loan, eligibility_rules):
        service = LoanApplicationService()
        app = service.create_application(
            member=member, loan_type=flat_loan, requested_amount=Decimal('10000'),
            duration_months=3, purpose='Test loan',
        )
        loan = service.approve_application(app, admin_user)
        assert loan.total_repayment == Decimal('11000.00')
        assert sum(s.expected_amount for s in loan.schedules.all()) == Decimal('11000.00')


SIGNUP = {
    'email': 'school@test.com', 'first_name': 'S', 'last_name': 'F',
    'password': 'securepass123', 'nrc_number': '100003/13/1',
    'phone_number': '+260700000000', 'address': 'A',
    'department': 'Computing and Informatics', 'employment_status': 'PERMANENT',
    'consent': True,
}


@pytest.mark.django_db
class TestSchools:
    """Members type their own school/faculty; reports group by what they entered."""

    def test_signup_requires_school(self, client):
        response = client.post(
            '/api/members/signup/', {**SIGNUP, 'member_id': '555001'},
            content_type='application/json',
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'school' in response.json()

    def test_any_school_name_is_accepted(self, client):
        response = client.post('/api/members/signup/', {
            **SIGNUP, 'member_id': '555002', 'school': 'Directorate of Research',
            'department': 'Grants Office',
        }, content_type='application/json')
        assert response.status_code == status.HTTP_201_CREATED
        new = Member.objects.get(member_id='555002')
        assert new.school == 'Directorate of Research'
        assert new.department == 'Grants Office'

    def test_spelling_matches_existing_entries(self, client, member):
        member.school = 'School of Natural Sciences'
        member.department = 'Computing and Informatics'
        member.save()
        response = client.post('/api/members/signup/', {
            **SIGNUP, 'member_id': '555003',
            'school': '  school of natural   sciences ', 'department': 'computing and informatics',
        }, content_type='application/json')
        assert response.status_code == status.HTTP_201_CREATED
        new = Member.objects.get(member_id='555003')
        assert new.school == 'School of Natural Sciences'
        assert new.department == 'Computing and Informatics'

    def test_filter_options_come_from_members(self, auth_client_admin, member, pending_member):
        member.school, member.department = 'School of Law', 'Public Law'
        member.save()
        pending_member.school, pending_member.department = 'School of Law', 'Private Law'
        pending_member.save()
        response = auth_client_admin.get('/api/members/schools/')
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == [
            {'school': 'School of Law', 'departments': ['Private Law', 'Public Law']},
        ]

    def test_filter_options_are_staff_only(self, auth_client_member, member):
        assert auth_client_member.get('/api/members/schools/').status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestMembershipReport:
    @pytest.fixture
    def staff_members(self, member, pending_member):
        member.school, member.department = 'School of Natural Sciences', 'Computing and Informatics'  # ACTIVE
        member.save()
        pending_member.school, pending_member.department = 'School of Law', 'Public Law'  # PENDING
        pending_member.save()
        return member, pending_member

    def test_totals_by_school_department_and_status(self, auth_client_admin, staff_members):
        data = auth_client_admin.get('/api/reports/membership/').json()
        assert data['total'] == 2
        assert {r['school']: r['count'] for r in data['by_school']} == {
            'School of Natural Sciences': 1, 'School of Law': 1,
        }
        assert {r['status']: r['count'] for r in data['by_status']} == {'ACTIVE': 1, 'PENDING': 1}

    def test_filters(self, auth_client_admin, staff_members):
        member, _ = staff_members
        # Filters ignore capitals
        assert auth_client_admin.get(
            '/api/reports/membership/', {'school': 'school of law'}
        ).json()['total'] == 1
        by_school = auth_client_admin.get(
            '/api/reports/membership/', {'school': 'School of Natural Sciences'}
        ).json()
        assert [m['member_id'] for m in by_school['members']] == [member.member_id]
        current = auth_client_admin.get('/api/reports/membership/', {'status': 'ACTIVE'}).json()
        assert current['total'] == 1
        by_dept = auth_client_admin.get(
            '/api/reports/membership/', {'department': 'Public Law'}
        ).json()
        assert by_dept['members'][0]['membership_status'] == 'PENDING'

    def test_counts_members_not_applications(
        self, auth_client_admin, staff_members, loan_type
    ):
        from loans.models import LoanApplication

        member, _ = staff_members
        for _ in range(3):
            LoanApplication.objects.create(
                member=member, loan_type=loan_type, requested_amount=5000,
                duration_months=6, purpose='Test', status='REJECTED',
            )
        data = auth_client_admin.get('/api/reports/membership/', {'status': 'ACTIVE'}).json()
        assert data['by_school'] == [{'school': 'School of Natural Sciences', 'count': 1}]
        assert data['members'][0]['application_count'] == 3

    def test_csv_export_uses_filters(self, auth_client_admin, staff_members):
        response = auth_client_admin.get(
            '/api/reports/membership/export/csv/', {'school': 'School of Law'}
        )
        assert response.status_code == status.HTTP_200_OK
        body = response.content.decode()
        assert 'MAN Number' in body and 'Public Law' in body
        assert 'Computing and Informatics' not in body

    def test_members_cannot_view(self, auth_client_member, member):
        response = auth_client_member.get('/api/reports/membership/')
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestLoanTypes:
    """Admins can add loan types; members choose one when several are on offer."""

    payload = {
        'name': 'Emergency Loan',
        'description': 'Quick help for urgent needs',
        'allowed_amounts': [5000, 2000, 5000],
        'interest_rate': '5',
        'max_duration_months': 6,
        'is_active': True,
    }

    def test_admin_adds_loan_type(self, auth_client_admin):
        response = auth_client_admin.post('/api/loan-types/', self.payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED, response.json()
        new = LoanType.objects.get(name='Emergency Loan')
        assert new.allowed_amounts == [2000, 5000]  # sorted, duplicates removed
        assert new.min_amount == 2000 and new.max_amount == 5000
        assert new.interest_method == 'FLAT_ONCE' and new.min_duration_months == 1

    @pytest.mark.parametrize('field, value', [
        ('allowed_amounts', []),
        ('allowed_amounts', [0, 1000]),
        ('interest_rate', '150'),
        ('max_duration_months', 0),
    ])
    def test_invalid_loan_type_rejected(self, auth_client_admin, field, value):
        response = auth_client_admin.post(
            '/api/loan-types/', {**self.payload, field: value}, format='json'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert field in response.json()

    def test_duplicate_name_rejected(self, auth_client_admin, flat_loan):
        response = auth_client_admin.post(
            '/api/loan-types/', {**self.payload, 'name': 'flat loan'}, format='json'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_loan_types_cannot_be_deleted(self, auth_client_admin, flat_loan):
        assert auth_client_admin.delete(f'/api/loan-types/{flat_loan.id}/').status_code == 405
        assert auth_client_admin.delete(f'/api/admin/config/loan-types/{flat_loan.id}/').status_code == 405
        assert LoanType.objects.filter(pk=flat_loan.pk).exists()

    def test_members_cannot_add_types(self, auth_client_member, member):
        response = auth_client_member.post('/api/loan-types/', self.payload, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_member_must_choose_when_several_types(
        self, auth_client_admin, auth_client_member, member, flat_loan, eligibility_rules
    ):
        auth_client_admin.post('/api/loan-types/', self.payload, format='json')
        application = {'requested_amount': 10000, 'duration_months': 6, 'purpose': 'School fees for the term'}
        response = auth_client_member.post('/api/loan-applications/', application, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()['error'] == 'Choose a loan type'

        emergency = LoanType.objects.get(name='Emergency Loan')
        response = auth_client_member.post('/api/loan-applications/', {
            **application, 'loan_type': emergency.id, 'requested_amount': 2000,
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED

    def test_switched_off_type_hidden_from_members(self, auth_client_admin, auth_client_member, member, flat_loan):
        auth_client_admin.patch(f'/api/loan-types/{flat_loan.id}/', {'is_active': False}, format='json')
        names = [t['name'] for t in auth_client_member.get('/api/loan-types/').json()['results']]
        assert 'Flat Loan' not in names
