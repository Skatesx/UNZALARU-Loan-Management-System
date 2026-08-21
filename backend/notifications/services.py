from .models import Notification


class NotificationService:
    """Service for creating and managing notifications."""

    @staticmethod
    def create(user, title, message, notification_type, **kwargs):
        """Create a notification."""
        return Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
            **kwargs,
        )

    @classmethod
    def notify_loan_submitted(cls, application):
        """Notify member that their loan application has been submitted."""
        cls.create(
            user=application.member.user,
            title='Loan Application Submitted',
            message=f'Your loan application {application.application_id} for K{application.requested_amount} has been submitted successfully.',
            notification_type='LOAN_SUBMITTED',
            related_application=application,
        )

    @classmethod
    def notify_loan_approved(cls, loan):
        """Notify member that their loan has been approved."""
        cls.create(
            user=loan.member.user,
            title='Loan Approved',
            message=f'Your loan application {loan.application.application_id} has been approved. Loan {loan.loan_id} for K{loan.principal} has been created.',
            notification_type='LOAN_APPROVED',
            related_loan=loan,
            related_application=loan.application,
        )

    @classmethod
    def notify_loan_rejected(cls, application, reason):
        """Notify member that their loan has been rejected."""
        cls.create(
            user=application.member.user,
            title='Loan Application Rejected',
            message=f'Your loan application {application.application_id} has been rejected. Reason: {reason}',
            notification_type='LOAN_REJECTED',
            related_application=application,
        )

    @classmethod
    def notify_repayment_due(cls, schedule):
        """Notify member that a repayment is due."""
        cls.create(
            user=schedule.loan.member.user,
            title='Repayment Due',
            message=f'Your repayment of K{schedule.remaining_amount} for loan {schedule.loan.loan_id} is due on {schedule.due_date}.',
            notification_type='REPAYMENT_DUE',
            related_loan=schedule.loan,
        )

    @classmethod
    def notify_repayment_overdue(cls, schedule):
        """Notify member that a repayment is overdue."""
        cls.create(
            user=schedule.loan.member.user,
            title='Repayment Overdue',
            message=f'Your repayment of K{schedule.remaining_amount} for loan {schedule.loan.loan_id} is {schedule.days_overdue} days overdue.',
            notification_type='REPAYMENT_OVERDUE',
            related_loan=schedule.loan,
        )

    @classmethod
    def notify_status_change(cls, user, title, message):
        """Generic status change notification."""
        cls.create(
            user=user,
            title=title,
            message=message,
            notification_type='STATUS_CHANGE',
        )
