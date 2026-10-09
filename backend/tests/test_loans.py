import pytest
from decimal import Decimal
from rest_framework import status

from loans.models import LoanApplication, Loan
from loans.services import LoanCalculationService, LoanApplicationService


@pytest.mark.django_db
class TestLoanCalculation:
    """Test loan calculation service."""

    def test_flat_interest(self):
        """Test flat rate interest calculation."""
        service = LoanCalculationService()
        result = service.calculate_flat_interest(
            principal=Decimal('20000'),
            annual_rate=Decimal('12'),
            months=12
        )
        # 20000 * 0.12 * (12/12) = 2400
        assert result == Decimal('2400.00')

    def test_reducing_balance_interest(self):
        """Test reducing balance interest calculation."""
        service = LoanCalculationService()
        result = service.calculate_reducing_balance_interest(
            principal=Decimal('20000'),
            annual_rate=Decimal('12'),
            months=12
        )
        assert result > 0
        assert result < Decimal('2400')  # Should be less than flat rate

    def test_monthly_installment(self):
        """Test monthly installment calculation."""
        service = LoanCalculationService()
        result = service.calculate_monthly_installment(
            principal=Decimal('20000'),
            total_interest=Decimal('2400'),
            months=12
        )
        # (20000 + 2400) / 12 = 1866.67
        assert result == Decimal('1866.67')

    def test_generate_installment_dates(self):
        """Test installment date generation."""
        from datetime import date
        service = LoanCalculationService()
        dates = service.generate_installment_dates(date(2026, 1, 15), 3)
        assert len(dates) == 3
        assert dates[0] == date(2026, 2, 15)
        assert dates[1] == date(2026, 3, 15)
        assert dates[2] == date(2026, 4, 15)

    def test_generate_installment_dates_end_of_month(self):
        """Loans approved on the 31st clamp to shorter months instead of crashing."""
        from datetime import date
        service = LoanCalculationService()
        dates = service.generate_installment_dates(date(2026, 1, 31), 4)
        assert dates == [
            date(2026, 2, 28),
            date(2026, 3, 31),
            date(2026, 4, 30),
            date(2026, 5, 31),
        ]

    def test_generate_installment_dates_across_year(self):
        from datetime import date
        service = LoanCalculationService()
        dates = service.generate_installment_dates(date(2026, 11, 30), 3)
        assert dates == [date(2026, 12, 30), date(2027, 1, 30), date(2027, 2, 28)]


@pytest.mark.django_db
class TestLoanApplication:
    """Test loan application workflow."""

    def test_create_application(self, member, loan_type, eligibility_rules):
        """Valid application can be created."""
        service = LoanApplicationService()
        app = service.create_application(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('10000'),
            duration_months=6,
            purpose='Test loan',
        )
        assert app.status == 'PENDING'
        assert app.application_id.startswith('APP-')

    def test_reject_invalid_amount(self, member, loan_type, eligibility_rules):
        """Invalid amount is rejected."""
        service = LoanApplicationService()
        with pytest.raises(ValueError, match='Maximum loan amount'):
            service.create_application(
                member=member,
                loan_type=loan_type,
                requested_amount=Decimal('999999'),
                duration_months=6,
                purpose='Test loan',
            )

    def test_reject_duplicate_pending(self, member, loan_type, eligibility_rules):
        """Duplicate pending application is rejected."""
        service = LoanApplicationService()
        service.create_application(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('5000'),
            duration_months=6,
            purpose='Test loan',
        )
        with pytest.raises(ValueError, match='already have a pending'):
            service.create_application(
                member=member,
                loan_type=loan_type,
                requested_amount=Decimal('5000'),
                duration_months=6,
                purpose='Another test loan',
            )

    def test_approve_application(self, admin_user, member, loan_type, eligibility_rules):
        """Application can be approved."""
        service = LoanApplicationService()
        app = service.create_application(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('10000'),
            duration_months=6,
            purpose='Test loan',
        )
        loan = service.approve_application(app, admin_user)
        assert loan is not None
        assert loan.loan_id.startswith('LN-')
        assert loan.status == 'ACTIVE'
        assert loan.outstanding_balance > 0

    def test_reject_application(self, admin_user, member, loan_type, eligibility_rules):
        """Application can be rejected."""
        service = LoanApplicationService()
        app = service.create_application(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('10000'),
            duration_months=6,
            purpose='Test loan',
        )
        rejected = service.reject_application(app, admin_user, 'Insufficient documentation')
        assert rejected.status == 'REJECTED'
        assert rejected.rejection_reason == 'Insufficient documentation'


@pytest.mark.django_db
class TestLoanEndpoints:
    """Test loan API endpoints."""

    def test_member_can_submit_application(self, auth_client_member, member, loan_type, eligibility_rules):
        """Member can submit a loan application."""
        response = auth_client_member.post('/api/loan-applications/', {
            'loan_type': loan_type.id,
            'requested_amount': 10000,
            'duration_months': 6,
            'purpose': 'Test loan',
        }, content_type='application/json')
        assert response.status_code == status.HTTP_201_CREATED

    def test_duplicate_application_returns_400_with_message(self, auth_client_member, member, loan_type, eligibility_rules):
        """Business-rule failures are a 400 with a readable error, not a 500."""
        payload = {
            'loan_type': loan_type.id,
            'requested_amount': 5000,
            'duration_months': 6,
            'purpose': 'Test loan',
        }
        first = auth_client_member.post('/api/loan-applications/', payload, content_type='application/json')
        assert first.status_code == status.HTTP_201_CREATED
        second = auth_client_member.post('/api/loan-applications/', payload, content_type='application/json')
        assert second.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already have a pending' in second.json()['error']

    def test_member_can_list_own_applications(self, auth_client_member, member, loan_type, eligibility_rules):
        """Member can list their own applications."""
        service = LoanApplicationService()
        service.create_application(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('5000'),
            duration_months=6,
            purpose='Test loan',
        )
        response = auth_client_member.get('/api/loan-applications/')
        assert response.status_code == status.HTTP_200_OK

    def test_admin_can_list_all_applications(self, auth_client_admin, member, loan_type, eligibility_rules):
        """Admin can list all applications."""
        response = auth_client_admin.get('/api/loan-applications/')
        assert response.status_code == status.HTTP_200_OK

    def test_admin_can_approve(self, auth_client_admin, member, loan_type, eligibility_rules):
        """Admin can approve an application."""
        service = LoanApplicationService()
        app = service.create_application(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('10000'),
            duration_months=6,
            purpose='Test loan',
        )
        response = auth_client_admin.put(
            f'/api/loan-applications/{app.id}/approve/',
            content_type='application/json'
        )
        assert response.status_code == status.HTTP_200_OK

    def test_member_cannot_edit_or_delete_application(self, auth_client_member, member, loan_type, eligibility_rules):
        """Applications can't be changed through generic PATCH/PUT/DELETE."""
        service = LoanApplicationService()
        app = service.create_application(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('5000'),
            duration_months=6,
            purpose='Test loan',
        )
        url = f'/api/loan-applications/{app.id}/'
        response = auth_client_member.patch(
            url, {'requested_amount': 999999}, content_type='application/json'
        )
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        response = auth_client_member.delete(url)
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
        app.refresh_from_db()
        assert app.requested_amount == Decimal('5000')
