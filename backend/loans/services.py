from datetime import date, timedelta
from decimal import Decimal

from django.db import transaction
from django.utils import timezone


class LoanCalculationService:
    """Centralized loan calculation engine."""

    @staticmethod
    def calculate_flat_interest(principal, annual_rate, months):
        """Flat rate: interest = principal * rate * (months/12)."""
        total_interest = Decimal(str(principal)) * (Decimal(str(annual_rate)) / Decimal('100')) * (Decimal(str(months)) / Decimal('12'))
        return total_interest.quantize(Decimal('0.01'))

    @staticmethod
    def calculate_reducing_balance_interest(principal, annual_rate, months):
        """Reducing balance: EMI using standard amortization formula."""
        principal = Decimal(str(principal))
        annual_rate = Decimal(str(annual_rate))
        monthly_rate = annual_rate / Decimal('100') / Decimal('12')

        if monthly_rate == 0:
            return (principal / Decimal(str(months))).quantize(Decimal('0.01'))

        # EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
        factor = (1 + monthly_rate) ** months
        emi = principal * monthly_rate * factor / (factor - 1)
        total = emi * Decimal(str(months))
        total_interest = total - principal
        return total_interest.quantize(Decimal('0.01'))

    @staticmethod
    def calculate_monthly_installment(principal, total_interest, months):
        """Divide total repayment equally across installments."""
        total = Decimal(str(principal)) + Decimal(str(total_interest))
        installment = total / Decimal(str(months))
        return installment.quantize(Decimal('0.01'))

    @staticmethod
    def generate_installment_dates(start_date, months):
        """Generate monthly due dates starting from next month."""
        dates = []
        current = start_date
        for _ in range(months):
            if current.month == 12:
                next_date = current.replace(year=current.year + 1, month=1)
            else:
                next_date = current.replace(month=current.month + 1)
            dates.append(next_date)
            current = next_date
        return dates

    def calculate_loan(self, principal, annual_rate, months, interest_method):
        """Calculate all loan details based on interest method."""
        if interest_method == 'FLAT':
            total_interest = self.calculate_flat_interest(principal, annual_rate, months)
        else:
            total_interest = self.calculate_reducing_balance_interest(principal, annual_rate, months)

        monthly_installment = self.calculate_monthly_installment(principal, total_interest, months)
        total_repayment = Decimal(str(principal)) + total_interest

        return {
            'principal': Decimal(str(principal)),
            'interest_rate': Decimal(str(annual_rate)),
            'interest_method': interest_method,
            'total_interest': total_interest,
            'total_repayment': total_repayment.quantize(Decimal('0.01')),
            'duration_months': months,
            'monthly_installment': monthly_installment,
        }


class LoanApplicationService:
    """Handles loan application workflow."""

    def __init__(self):
        self.calculation_service = LoanCalculationService()

    @transaction.atomic
    def create_application(self, member, loan_type, requested_amount, duration_months,
                           purpose, employment_info=None, income_info=None,
                           obligations=None):
        """Create a new loan application with validation."""
        from loans.models import LoanApplication

        # Validate member is active
        if member.membership_status != 'ACTIVE':
            raise ValueError('Member account is not active')
        if member.account_status != 'ACTIVE':
            raise ValueError('Member account is deactivated')

        # Validate amount within loan type limits
        if requested_amount < loan_type.min_amount:
            raise ValueError(f'Minimum loan amount is K{loan_type.min_amount}')
        if requested_amount > loan_type.max_amount:
            raise ValueError(f'Maximum loan amount is K{loan_type.max_amount}')

        # Validate duration within loan type limits
        if duration_months < loan_type.min_duration_months:
            raise ValueError(f'Minimum duration is {loan_type.min_duration_months} months')
        if duration_months > loan_type.max_duration_months:
            raise ValueError(f'Maximum duration is {loan_type.max_duration_months} months')

        # Check for duplicate pending application for same loan type
        existing = LoanApplication.objects.filter(
            member=member,
            loan_type=loan_type,
            status__in=['PENDING', 'UNDER_REVIEW']
        ).exists()
        if existing:
            raise ValueError('You already have a pending application for this loan type')

        # Check active loans if multiple not allowed
        if not loan_type.allow_multiple_active:
            from loans.models import Loan
            has_active = Loan.objects.filter(
                member=member,
                loan_type=loan_type,
                status='ACTIVE'
            ).exists()
            if has_active:
                raise ValueError('You already have an active loan of this type')

        # Create application
        application = LoanApplication.objects.create(
            member=member,
            loan_type=loan_type,
            requested_amount=requested_amount,
            duration_months=duration_months,
            purpose=purpose,
            current_employment_info=employment_info or {},
            income_info=income_info or {},
            existing_loan_obligations=obligations or [],
            status='PENDING',
        )

        # Calculate eligibility score
        from eligibility.services import EligibilityScoringService
        scoring_service = EligibilityScoringService()
        scoring_service.calculate(application)

        return application

    @transaction.atomic
    def approve_application(self, application, approved_by):
        """Approve a loan application and create the loan."""
        from loans.models import Loan
        from notifications.services import NotificationService
        from repayments.services import RepaymentScheduleService

        if application.status not in ['PENDING', 'UNDER_REVIEW']:
            raise ValueError(f'Cannot approve application with status {application.status}')

        # Calculate loan details
        loan_details = self.calculation_service.calculate_loan(
            principal=application.requested_amount,
            annual_rate=application.loan_type.interest_rate,
            months=application.duration_months,
            interest_method=application.loan_type.interest_method,
        )

        # Create loan
        loan = Loan.objects.create(
            application=application,
            member=application.member,
            loan_type=application.loan_type,
            principal=loan_details['principal'],
            interest_rate=loan_details['interest_rate'],
            interest_method=loan_details['interest_method'],
            total_interest=loan_details['total_interest'],
            total_repayment=loan_details['total_repayment'],
            duration_months=loan_details['duration_months'],
            monthly_installment=loan_details['monthly_installment'],
            outstanding_balance=loan_details['total_repayment'],
            approved_by=approved_by,
        )

        # Update application status
        application.status = 'APPROVED'
        application.reviewed_by = approved_by
        application.reviewed_at = timezone.now()
        application.save()

        # Generate repayment schedule
        schedule_service = RepaymentScheduleService()
        schedule_service.generate_schedule(loan)

        # Send notification
        NotificationService.notify_loan_approved(loan)

        return loan

    @transaction.atomic
    def reject_application(self, application, rejected_by, reason=''):
        """Reject a loan application."""
        from notifications.services import NotificationService

        if application.status not in ['PENDING', 'UNDER_REVIEW']:
            raise ValueError(f'Cannot reject application with status {application.status}')

        application.status = 'REJECTED'
        application.rejection_reason = reason
        application.reviewed_by = rejected_by
        application.reviewed_at = timezone.now()
        application.save()

        # Send notification
        NotificationService.notify_loan_rejected(application, reason)

        return application

    @transaction.atomic
    def cancel_application(self, application):
        """Cancel a loan application (member action)."""
        if application.status not in ['PENDING', 'UNDER_REVIEW']:
            raise ValueError(f'Cannot cancel application with status {application.status}')

        application.status = 'CANCELLED'
        application.save()
        return application
