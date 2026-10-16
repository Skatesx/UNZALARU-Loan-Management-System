from datetime import date
from decimal import Decimal
from io import StringIO

import pytest
from django.core.management import call_command
from django.db.models import Count, Sum

from audit.models import AuditLog
from loans.models import Loan, LoanApplication
from loans.services import LoanApplicationService
from members.models import Member
from repayments.models import Repayment


def run_seed(*args):
    call_command('load_seed_data', *args, stdout=StringIO())


@pytest.mark.django_db
class TestSeedData:
    def test_loan_totals_match_recorded_payments(self):
        run_seed()
        assert Loan.objects.exists()
        for loan in Loan.objects.all():
            paid = loan.repayments.aggregate(s=Sum('amount'))['s'] or Decimal('0')
            assert loan.amount_repaid == paid
            assert loan.outstanding_balance == loan.total_repayment - paid
            schedule_total = loan.schedules.aggregate(s=Sum('expected_amount'))['s']
            assert schedule_total == loan.total_repayment

    def test_future_installments_are_not_paid(self):
        run_seed()
        future_paid = Repayment.objects.filter(schedule__due_date__gt=date.today())
        assert not future_paid.exists()

    def test_one_active_loan_per_member(self):
        run_seed()
        assert not Member.objects.annotate(
            n=Count('loans')
        ).filter(n__gt=1, loans__status='ACTIVE').exists()

    def test_running_twice_does_not_duplicate(self):
        run_seed()
        apps, loans = LoanApplication.objects.count(), Loan.objects.count()
        run_seed()
        assert LoanApplication.objects.count() == apps
        assert Loan.objects.count() == loans

    def test_reset_reloads_and_restores_pending_members(self):
        run_seed()
        bupe = Member.objects.get(user__email='bupe.chisanga@unzalaru.com')
        bupe.membership_status = 'ACTIVE'
        bupe.save()
        loans = Loan.objects.count()

        run_seed('--reset')

        bupe.refresh_from_db()
        assert bupe.membership_status == 'PENDING'
        assert Loan.objects.count() == loans


@pytest.mark.django_db
class TestLoanDecisionAudit:
    def _application(self, member, loan_type):
        return LoanApplicationService().create_application(
            member=member,
            loan_type=loan_type,
            requested_amount=Decimal('10000'),
            duration_months=6,
            purpose='Test loan',
        )

    def test_approval_is_audit_logged(self, admin_user, member, loan_type, eligibility_rules):
        app = self._application(member, loan_type)
        LoanApplicationService().approve_application(app, admin_user)
        entry = AuditLog.objects.get(action='APPROVED_LOAN')
        assert entry.entity_id == app.application_id
        assert entry.user == admin_user

    def test_rejection_is_audit_logged(self, admin_user, member, loan_type, eligibility_rules):
        app = self._application(member, loan_type)
        LoanApplicationService().reject_application(app, admin_user, 'Incomplete documents')
        entry = AuditLog.objects.get(action='REJECTED_LOAN')
        assert entry.entity_id == app.application_id
        assert 'Incomplete documents' in entry.description
