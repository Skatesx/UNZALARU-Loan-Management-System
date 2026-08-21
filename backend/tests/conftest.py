import pytest
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from eligibility.models import EligibilityRule
from loans.models import LoanType
from members.models import Member

User = get_user_model()


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    user = User.objects.create_user(
        email='admin@test.com',
        username='admin_test',
        password='testpass123',
        first_name='Admin',
        last_name='User',
        role='ADMIN',
        is_staff=True,
        is_superuser=True,
    )
    return user


@pytest.fixture
def member_user(db):
    """Create a member user."""
    user = User.objects.create_user(
        email='member@test.com',
        username='member_test',
        password='testpass123',
        first_name='Member',
        last_name='User',
        role='MEMBER',
    )
    return user


@pytest.fixture
def member(member_user):
    """Create a member profile."""
    return Member.objects.create(
        user=member_user,
        nrc_number='NRC-123456',
        phone_number='+260700000000',
        address='123 Test Road, Lusaka',
        department='Computer Science',
        employment_status='PERMANENT',
        monthly_income=Decimal('10000.00'),
    )


@pytest.fixture
def loan_type(db):
    """Create a loan type."""
    return LoanType.objects.create(
        name='Test Loan',
        description='Test loan type',
        min_amount=Decimal('1000.00'),
        max_amount=Decimal('50000.00'),
        min_duration_months=3,
        max_duration_months=24,
        interest_rate=Decimal('12.00'),
        interest_method='FLAT',
        allow_multiple_active=False,
    )


@pytest.fixture
def eligibility_rules(db):
    """Create default eligibility rules."""
    rules = [
        EligibilityRule.objects.create(
            name='Income Score',
            factor='INCOME',
            weight=Decimal('30.00'),
            thresholds=[
                {'min': 0, 'max': 5000, 'score': 30},
                {'min': 5001, 'max': 15000, 'score': 70},
                {'min': 15001, 'max': None, 'score': 100},
            ],
        ),
        EligibilityRule.objects.create(
            name='Employment Stability',
            factor='EMPLOYMENT',
            weight=Decimal('25.00'),
            thresholds=[
                {'min': 0, 'max': 30, 'score': 30},
                {'min': 31, 'max': 60, 'score': 60},
                {'min': 61, 'max': 100, 'score': 100},
            ],
        ),
        EligibilityRule.objects.create(
            name='Existing Obligations',
            factor='OBLIGATIONS',
            weight=Decimal('25.00'),
            thresholds=[
                {'min': 0, 'max': 0, 'score': 100},
                {'min': 1, 'max': 1, 'score': 70},
                {'min': 2, 'max': 100, 'score': 20},
            ],
        ),
        EligibilityRule.objects.create(
            name='Repayment History',
            factor='REPAYMENT_HISTORY',
            weight=Decimal('20.00'),
            thresholds=[
                {'min': 0, 'max': 30, 'score': 20},
                {'min': 31, 'max': 60, 'score': 50},
                {'min': 61, 'max': 100, 'score': 80},
            ],
        ),
    ]
    return rules


@pytest.fixture
def auth_client_admin(client, admin_user):
    """Authenticated DRF client with admin user."""
    api_client = APIClient()
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def auth_client_member(client, member_user):
    """Authenticated DRF client with member user."""
    api_client = APIClient()
    api_client.force_authenticate(user=member_user)
    return api_client
