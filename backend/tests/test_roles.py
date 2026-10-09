"""Role-based access control tests, including the SUPERVISOR role and the
loan application submission error handling."""
import datetime
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from loans.services import LoanCalculationService

User = get_user_model()


@pytest.fixture
def supervisor_user(db):
    user = User.objects.create_user(
        email='supervisor@test.com',
        username='supervisor_test',
        password='testpass123',
        first_name='Sara',
        last_name='Supervisor',
        role='SUPERVISOR',
    )
    return user


@pytest.fixture
def supervisor_client(client, supervisor_user):
    api_client = APIClient()
    api_client.force_authenticate(user=supervisor_user)
    return api_client


@pytest.fixture
def auth_client_pending_member(client, pending_member_user):
    api_client = APIClient()
    api_client.force_authenticate(user=pending_member_user)
    return api_client


@pytest.fixture
def application(member, loan_type):
    from loans.models import LoanApplication

    return LoanApplication.objects.create(
        member=member,
        loan_type=loan_type,
        requested_amount=Decimal('5000.00'),
        duration_months=6,
        purpose='School fees for the new term',
        status='PENDING',
    )


@pytest.mark.django_db
class TestSupervisorRole:
    def test_supervisor_can_see_all_applications(self, supervisor_client, application):
        response = supervisor_client.get('/api/loan-applications/')
        assert response.status_code == 200
        ids = [r['id'] for r in response.data['results']]
        assert application.id in ids

    def test_supervisor_can_evaluate_criteria(self, supervisor_client, application):
        response = supervisor_client.get(
            f'/api/loan-applications/{application.id}/criteria/'
        )
        assert response.status_code == 200
        assert 'passed' in response.data

    def test_supervisor_can_approve_application(self, supervisor_client, application):
        response = supervisor_client.put(
            f'/api/loan-applications/{application.id}/approve/',
            {'override_reason': 'Verified income personally; committee concurred'},
        )
        assert response.status_code == 200, response.data
        application.refresh_from_db()
        assert application.status == 'APPROVED'

    def test_supervisor_can_reject_application(self, supervisor_client, application):
        response = supervisor_client.put(
            f'/api/loan-applications/{application.id}/reject/',
            {'reason': 'Insufficient repayment capacity'},
        )
        assert response.status_code == 200
        application.refresh_from_db()
        assert application.status == 'REJECTED'

    def test_supervisor_can_list_repayments(self, supervisor_client):
        assert supervisor_client.get('/api/repayments/').status_code == 200

    def test_supervisor_can_view_defaulters(self, supervisor_client):
        assert supervisor_client.get('/api/defaulters/').status_code == 200

    def test_supervisor_can_view_audit_log(self, supervisor_client):
        assert supervisor_client.get('/api/audit/').status_code == 200

    def test_supervisor_can_view_reports(self, supervisor_client):
        assert supervisor_client.get('/api/reports/loans/').status_code == 200

    def test_supervisor_can_view_dashboard(self, supervisor_client):
        response = supervisor_client.get('/api/dashboard/admin/summary/')
        assert response.status_code == 200

    def test_supervisor_can_view_members(self, supervisor_client):
        assert supervisor_client.get('/api/members/').status_code == 200

    def test_supervisor_can_verify_income(self, supervisor_client, member):
        response = supervisor_client.post(
            f'/api/members/{member.id}/verify-income/',
            {'verified_income': '9500.00'},
        )
        assert response.status_code == 200
        member.refresh_from_db()
        assert member.income_verified is True
        assert member.verified_income == Decimal('9500.00')

    def test_supervisor_cannot_create_member(self, supervisor_client):
        response = supervisor_client.post('/api/members/', {})
        assert response.status_code == 403

    def test_supervisor_cannot_update_member(self, supervisor_client, member):
        response = supervisor_client.patch(
            f'/api/members/{member.id}/', {'department': 'X'}
        )
        assert response.status_code == 403

    def test_supervisor_cannot_approve_member(self, supervisor_client, member):
        response = supervisor_client.post(f'/api/members/{member.id}/approve/')
        assert response.status_code == 403

    def test_supervisor_cannot_manage_loan_types(self, supervisor_client):
        response = supervisor_client.post('/api/loan-types/', {})
        assert response.status_code == 403

    def test_supervisor_cannot_access_system_config(self, supervisor_client):
        assert supervisor_client.get('/api/admin/config/system/').status_code == 403

    def test_supervisor_cannot_manage_users(self, supervisor_client):
        assert supervisor_client.get('/api/auth/users/').status_code == 403

    def test_supervisor_cannot_modify_eligibility_rules(self, supervisor_client):
        response = supervisor_client.post('/api/eligibility/rules/', {})
        assert response.status_code == 403


@pytest.mark.django_db
class TestMemberRestrictions:
    def test_member_cannot_see_others_application(
        self, auth_client_pending_member, application
    ):
        response = auth_client_pending_member.get(
            f'/api/loan-applications/{application.id}/'
        )
        assert response.status_code == 404

    def test_member_cannot_approve(self, auth_client_member, application):
        response = auth_client_member.put(
            f'/api/loan-applications/{application.id}/approve/', {}
        )
        assert response.status_code == 403

    def test_member_cannot_record_repayment(self, auth_client_member):
        response = auth_client_member.post('/api/repayments/', {})
        assert response.status_code in (403, 404)

    def test_member_cannot_view_audit_log(self, auth_client_member):
        assert auth_client_member.get('/api/audit/').status_code in (403, 404)

    def test_member_cannot_view_reports(self, auth_client_member):
        assert auth_client_member.get('/api/reports/loans/').status_code in (403, 404)


@pytest.mark.django_db
class TestLoanApplicationSubmit:
    def test_member_create_application_returns_201(
        self, auth_client_member, member, loan_type
    ):
        from loans.models import LoanApplication

        response = auth_client_member.post('/api/loan-applications/', {
            'loan_type': loan_type.id,
            'requested_amount': '5000.00',
            'duration_months': 6,
            'purpose': 'School fees for the new term',
        })
        assert response.status_code == 201, response.data
        assert LoanApplication.objects.filter(
            member=member, status='PENDING'
        ).exists()

    def test_over_limit_duration_returns_clean_400(
        self, auth_client_member, member, loan_type
    ):
        """Business-rule ValueError must surface as 400, not an unhandled 500."""
        response = auth_client_member.post('/api/loan-applications/', {
            'loan_type': loan_type.id,
            'requested_amount': '5000.00',
            'duration_months': loan_type.max_duration_months + 6,
            'purpose': 'School fees for the new term',
        })
        assert response.status_code == 400
        assert 'Maximum duration' in response.data['error']

    def test_pending_member_cannot_apply_returns_400(
        self, auth_client_pending_member, pending_member, loan_type
    ):
        response = auth_client_pending_member.post('/api/loan-applications/', {
            'loan_type': loan_type.id,
            'requested_amount': '5000.00',
            'duration_months': 6,
            'purpose': 'School fees for the new term',
        })
        assert response.status_code == 400
        assert 'pending' in response.data['error'].lower()


@pytest.mark.django_db
class TestInstallmentDates:
    def test_short_months_are_clamped(self):
        dates = LoanCalculationService.generate_installment_dates(
            datetime.date(2026, 1, 30), 2
        )
        assert [str(d) for d in dates] == ['2026-02-28', '2026-03-28']

    def test_approvals_on_month_end_do_not_crash(self):
        dates = LoanCalculationService.generate_installment_dates(
            datetime.date(2026, 8, 31), 14
        )
        assert len(dates) == 14
        assert all(d.day >= 28 for d in dates)
