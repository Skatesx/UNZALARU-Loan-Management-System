"""Single flat loan product, schools from departments, and the membership report."""
from decimal import Decimal

import pytest
from rest_framework import status

from loans.models import LoanType
from loans.services import LoanApplicationService, LoanCalculationService
from members.models import Member
from members.schools import school_for_department


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


@pytest.mark.django_db
class TestSchools:
    def test_school_comes_from_department(self, member):
        member.department = 'Computer Science'
        member.save()
        assert member.school == 'School of Natural Sciences'
        member.department = 'Public Law'
        member.save(update_fields=['department'])
        member.refresh_from_db()
        assert member.school == 'School of Law'

    def test_unknown_department_has_no_school(self):
        assert school_for_department('Basket Weaving') == ''

    def test_schools_endpoint_is_public(self, client):
        response = client.get('/api/members/schools/')
        assert response.status_code == status.HTTP_200_OK
        natural = next(s for s in response.json() if s['school'] == 'School of Natural Sciences')
        assert 'Computer Science' in natural['departments']

    def test_signup_rejects_unlisted_department(self, client):
        response = client.post('/api/members/signup/', {
            'member_id': '55501', 'email': 'dept@test.com', 'first_name': 'D',
            'last_name': 'E', 'password': 'securepass123', 'nrc_number': 'NRC-DEPT',
            'phone_number': '+260700000000', 'address': 'A',
            'department': 'Basket Weaving', 'employment_status': 'PERMANENT',
        }, content_type='application/json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'department' in response.json()

    def test_signup_normalises_department_and_sets_school(self, client):
        response = client.post('/api/members/signup/', {
            'member_id': '55502', 'email': 'dept2@test.com', 'first_name': 'D',
            'last_name': 'E', 'password': 'securepass123', 'nrc_number': 'NRC-DEPT2',
            'phone_number': '+260700000000', 'address': 'A',
            'department': 'computer science', 'employment_status': 'PERMANENT',
        }, content_type='application/json')
        assert response.status_code == status.HTTP_201_CREATED
        new = Member.objects.get(member_id='55502')
        assert new.department == 'Computer Science'
        assert new.school == 'School of Natural Sciences'


@pytest.mark.django_db
class TestMembershipReport:
    @pytest.fixture
    def staff_members(self, member, pending_member):
        member.department = 'Computer Science'  # School of Natural Sciences, ACTIVE
        member.save()
        pending_member.department = 'Public Law'  # School of Law, PENDING
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
        assert 'Computer Science' not in body

    def test_members_cannot_view(self, auth_client_member, member):
        response = auth_client_member.get('/api/reports/membership/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
