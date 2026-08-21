from datetime import date, timedelta

from django.db import transaction

from .models import DefaulterStatus


class DefaulterDetectionService:
    """Computes defaulter classifications based on overdue days."""

    CLASSIFICATION_THRESHOLDS = {
        'CURRENT': (0, 0),
        'AT_RISK': (1, 30),
        'DEFAULTER': (31, 60),
        'SEVERE_DEFAULTER': (61, float('inf')),
    }

    def update_statuses(self):
        """
        Update defaulter statuses for all active loans.
        Returns the number of records updated.
        """
        from loans.models import Loan
        from repayments.models import RepaymentSchedule

        updated = 0
        active_loans = Loan.objects.filter(status='ACTIVE')

        for loan in active_loans:
            outstanding = RepaymentSchedule.objects.filter(
                loan=loan,
                payment_status__in=['PENDING', 'PARTIALLY_PAID', 'OVERDUE']
            )

            for schedule in outstanding:
                days = self.calculate_days_overdue(schedule.due_date)
                classification = self.classify(days)

                # Update schedule days overdue
                if schedule.days_overdue != days:
                    schedule.days_overdue = days
                    if days > 0 and schedule.payment_status != 'PARTIALLY_PAID':
                        schedule.payment_status = 'OVERDUE'
                    schedule.save()

                # Create or update defaulter status
                DefaulterStatus.objects.update_or_create(
                    member=loan.member,
                    loan=loan,
                    schedule=schedule,
                    defaults={
                        'days_overdue': days,
                        'classification': classification,
                    }
                )
                updated += 1

        return updated

    def update_loan_status(self, loan):
        """Update defaulter status for a specific loan."""
        from repayments.models import RepaymentSchedule

        outstanding = RepaymentSchedule.objects.filter(
            loan=loan,
            payment_status__in=['PENDING', 'PARTIALLY_PAID', 'OVERDUE']
        )

        for schedule in outstanding:
            days = self.calculate_days_overdue(schedule.due_date)
            classification = self.classify(days)

            if schedule.days_overdue != days:
                schedule.days_overdue = days
                if days > 0 and schedule.payment_status != 'PARTIALLY_PAID':
                    schedule.payment_status = 'OVERDUE'
                schedule.save()

            DefaulterStatus.objects.update_or_create(
                member=loan.member,
                loan=loan,
                schedule=schedule,
                defaults={
                    'days_overdue': days,
                    'classification': classification,
                }
            )

    def calculate_days_overdue(self, due_date):
        """Return max(0, (today - due_date).days)."""
        today = date.today()
        delta = (today - due_date).days
        return max(0, delta)

    def classify(self, days_overdue):
        """Classify based on overdue days thresholds."""
        for classification, (min_days, max_days) in self.CLASSIFICATION_THRESHOLDS.items():
            if min_days <= days_overdue <= max_days:
                return classification
        return 'SEVERE_DEFAULTER'

    def get_member_classification(self, member):
        """Get the worst classification for a member."""
        from loans.models import Loan

        active_loans = Loan.objects.filter(member=member, status='ACTIVE')
        worst = 'CURRENT'

        classification_order = ['CURRENT', 'AT_RISK', 'DEFAULTER', 'SEVERE_DEFAULTER']

        for loan in active_loans:
            statuses = DefaulterStatus.objects.filter(member=member, loan=loan)
            for status in statuses:
                idx = classification_order.index(status.classification)
                worst_idx = classification_order.index(worst)
                if idx > worst_idx:
                    worst = status.classification

        return worst
