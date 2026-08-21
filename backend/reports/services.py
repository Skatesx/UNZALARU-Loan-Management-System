import csv
from io import StringIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer


class ReportExportService:
    """Service for generating CSV and PDF reports."""

    @staticmethod
    def generate_csv(data, columns, filename):
        """
        Generate CSV file from data.

        data: list of dicts
        columns: list of (field_name, header_label) tuples
        """
        output = StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow([col[1] for col in columns])

        # Write data rows
        for row in data:
            writer.writerow([row.get(col[0], '') for col in columns])

        return output.getvalue()

    @staticmethod
    def generate_pdf(data, columns, title, filename):
        """
        Generate PDF report using reportlab.

        data: list of dicts
        columns: list of (field_name, header_label) tuples
        """
        output = StringIO()
        doc = SimpleDocTemplate(output, pagesize=landscape(letter))
        elements = []
        styles = getSampleStyleSheet()

        # Title
        elements.append(Paragraph(title, styles['Title']))
        elements.append(Spacer(1, 0.5 * inch))

        # Build table data
        table_data = [[col[1] for col in columns]]
        for row in data:
            table_data.append([str(row.get(col[0], '')) for col in columns])

        # Create table
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.Color(0.95, 0.95, 0.95)]),
        ]))

        elements.append(table)
        doc.build(elements)

        return output.getvalue()


class DashboardService:
    """Service for generating dashboard summary data."""

    @staticmethod
    def get_admin_summary():
        """Get admin dashboard summary cards."""
        from members.models import Member
        from loans.models import Loan, LoanApplication
        from repayments.models import Repayment
        from defaulters.models import DefaulterStatus
        from django.db.models import Sum

        total_members = Member.objects.count()
        pending_applications = LoanApplication.objects.filter(status='PENDING').count()
        approved_loans = Loan.objects.filter(status__in=['ACTIVE', 'COMPLETED']).count()
        active_loans = Loan.objects.filter(status='ACTIVE').count()

        total_loaned = Loan.objects.aggregate(
            total=Sum('principal')
        )['total'] or 0

        total_repaid = Loan.objects.aggregate(
            total=Sum('amount_repaid')
        )['total'] or 0

        outstanding_balance = Loan.objects.filter(
            status='ACTIVE'
        ).aggregate(total=Sum('outstanding_balance'))['total'] or 0

        at_risk = DefaulterStatus.objects.filter(
            classification='AT_RISK'
        ).values('member').distinct().count()

        defaulters = DefaulterStatus.objects.filter(
            classification='DEFAULTER'
        ).values('member').distinct().count()

        severe_defaulters = DefaulterStatus.objects.filter(
            classification='SEVERE_DEFAULTER'
        ).values('member').distinct().count()

        return {
            'total_members': total_members,
            'pending_applications': pending_applications,
            'approved_loans': approved_loans,
            'active_loans': active_loans,
            'total_amount_loaned': float(total_loaned),
            'total_amount_repaid': float(total_repaid),
            'outstanding_balance': float(outstanding_balance),
            'at_risk_borrowers': at_risk,
            'defaulters': defaulters,
            'severe_defaulters': severe_defaulters,
        }

    @staticmethod
    def get_member_summary(member):
        """Get member dashboard summary."""
        from loans.models import Loan, LoanApplication
        from defaulters.services import DefaulterDetectionService
        from repayments.services import RepaymentService
        from eligibility.models import EligibilityScore

        active_loan = Loan.objects.filter(
            member=member, status='ACTIVE'
        ).first()

        latest_score = EligibilityScore.objects.filter(
            application__member=member
        ).order_by('-calculated_at').first()

        defaulter_service = DefaulterDetectionService()
        borrower_status = defaulter_service.get_member_classification(member)

        repayment_service = RepaymentService()
        next_payment = repayment_service.get_next_payment(active_loan) if active_loan else None

        return {
            'eligibility_score': float(latest_score.total_score) if latest_score else None,
            'current_loan': {
                'loan_id': active_loan.loan_id,
                'principal': float(active_loan.principal),
                'monthly_installment': float(active_loan.monthly_installment),
                'outstanding_balance': float(active_loan.outstanding_balance),
            } if active_loan else None,
            'outstanding_balance': float(active_loan.outstanding_balance) if active_loan else 0,
            'next_payment': {
                'amount': float(next_payment.remaining_amount),
                'due_date': str(next_payment.due_date),
            } if next_payment else None,
            'borrower_status': borrower_status,
            'loan_applications_count': LoanApplication.objects.filter(member=member).count(),
            'loan_history_count': Loan.objects.filter(member=member).count(),
        }
