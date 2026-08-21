from datetime import datetime

from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from members.models import Member
from users.permissions import IsAdminUser

from .services import DashboardService, ReportExportService
from .serializers import (
    DefaulterReportSerializer,
    EligibilityReportSerializer,
    LoanReportSerializer,
    RepaymentReportSerializer,
)


class AdminDashboardSummaryView(APIView):
    """Admin dashboard summary endpoint."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        data = DashboardService.get_admin_summary()
        return Response(data)


class AdminDashboardChartsView(APIView):
    """Admin dashboard charts data endpoint."""

    permission_classes = [IsAdminUser]

    def get(self, request, chart_type):
        from loans.models import Loan, LoanApplication
        from repayments.models import Repayment
        from defaulters.models import DefaulterStatus
        from django.db.models import Count, Sum
        from django.db.models.functions import TruncMonth

        if chart_type == 'loans-over-time':
            data = Loan.objects.filter(
                status__in=['ACTIVE', 'COMPLETED']
            ).annotate(
                month=TruncMonth('date_approved')
            ).values('month').annotate(
                count=Count('id'),
                total=Sum('principal')
            ).order_by('month')
            return Response(list(data))

        elif chart_type == 'repayments-over-time':
            data = Repayment.objects.annotate(
                month=TruncMonth('payment_date')
            ).values('month').annotate(
                count=Count('id'),
                total=Sum('amount')
            ).order_by('month')
            return Response(list(data))

        elif chart_type == 'loan-status-distribution':
            data = Loan.objects.values('status').annotate(
                count=Count('id')
            )
            return Response(list(data))

        elif chart_type == 'application-distribution':
            data = LoanApplication.objects.values('status').annotate(
                count=Count('id')
            )
            return Response(list(data))

        elif chart_type == 'defaulters-by-classification':
            data = DefaulterStatus.objects.values('classification').annotate(
                count=Count('id', distinct=True)
            )
            return Response(list(data))

        elif chart_type == 'outstanding-amounts':
            from loans.models import Loan
            data = Loan.objects.filter(status='ACTIVE').values('loan_type__name').annotate(
                total=Sum('outstanding_balance'),
                count=Count('id')
            )
            return Response(list(data))

        return Response({'error': 'Unknown chart type'}, status=400)


class MemberDashboardView(APIView):
    """Member dashboard endpoint."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            member = Member.objects.get(user=request.user)
        except Member.DoesNotExist:
            return Response({'error': 'Member profile not found'}, status=404)

        data = DashboardService.get_member_summary(member)
        return Response(data)


class LoanReportView(APIView):
    """Loan report endpoint."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        from loans.models import Loan
        from django.db.models import Q

        queryset = Loan.objects.select_related(
            'member', 'member__user', 'loan_type'
        ).all()

        # Apply filters
        member_id = request.query_params.get('member_id')
        if member_id:
            queryset = queryset.filter(member__member_id=member_id)

        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        date_from = request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(date_approved__date__gte=date_from)

        date_to = request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(date_approved__date__lte=date_to)

        data = [
            {
                'loan_id': loan.loan_id,
                'member_name': loan.member.user.get_full_name(),
                'member_id': loan.member.member_id,
                'amount': float(loan.principal),
                'interest': float(loan.total_interest),
                'total_repayment': float(loan.total_repayment),
                'duration': loan.duration_months,
                'status': loan.status,
                'date_approved': loan.date_approved.isoformat(),
            }
            for loan in queryset
        ]

        return Response(data)


class RepaymentReportView(APIView):
    """Repayment report endpoint."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        from repayments.models import Repayment

        queryset = Repayment.objects.select_related(
            'loan', 'loan__member', 'loan__member__user', 'schedule'
        ).all()

        member_id = request.query_params.get('member_id')
        if member_id:
            queryset = queryset.filter(loan__member__member_id=member_id)

        date_from = request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(payment_date__date__gte=date_from)

        date_to = request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(payment_date__date__lte=date_to)

        data = [
            {
                'member_name': r.loan.member.user.get_full_name(),
                'member_id': r.loan.member.member_id,
                'loan_id': r.loan.loan_id,
                'expected_payment': float(r.schedule.expected_amount),
                'actual_payment': float(r.amount),
                'payment_date': r.payment_date.isoformat(),
                'outstanding_balance': float(r.loan.outstanding_balance),
                'status': r.schedule.payment_status,
            }
            for r in queryset
        ]

        return Response(data)


class DefaulterReportView(APIView):
    """Defaulter report endpoint."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        from defaulters.models import DefaulterStatus

        queryset = DefaulterStatus.objects.select_related(
            'member', 'member__user', 'loan'
        ).all()

        classification = request.query_params.get('classification')
        if classification:
            queryset = queryset.filter(classification=classification)

        data = [
            {
                'member_name': ds.member.user.get_full_name(),
                'member_id': ds.member.member_id,
                'loan_id': ds.loan.loan_id,
                'amount_overdue': float(ds.loan.outstanding_balance),
                'days_overdue': ds.days_overdue,
                'classification': ds.classification,
            }
            for ds in queryset
        ]

        return Response(data)


class EligibilityReportView(APIView):
    """Eligibility report endpoint."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        from eligibility.models import EligibilityScore

        queryset = EligibilityScore.objects.select_related(
            'application', 'application__member', 'application__member__user'
        ).all()

        data = [
            {
                'member_name': es.application.member.user.get_full_name(),
                'member_id': es.application.member.member_id,
                'application_id': es.application.application_id,
                'eligibility_score': float(es.total_score),
                'score_breakdown': es.breakdown,
                'recommendation': es.recommendation,
                'final_decision': es.application.status,
            }
            for es in queryset
        ]

        return Response(data)


class LoanReportExportView(APIView):
    """Export loan report as CSV or PDF."""

    permission_classes = [IsAdminUser]

    def get(self, request, format_type):
        from loans.models import Loan

        queryset = Loan.objects.select_related(
            'member', 'member__user', 'loan_type'
        ).all()

        data = [
            {
                'loan_id': loan.loan_id,
                'member_name': loan.member.user.get_full_name(),
                'member_id': loan.member.member_id,
                'amount': float(loan.principal),
                'interest': float(loan.total_interest),
                'total_repayment': float(loan.total_repayment),
                'duration': loan.duration_months,
                'status': loan.status,
                'date_approved': loan.date_approved.strftime('%Y-%m-%d'),
            }
            for loan in queryset
        ]

        columns = [
            ('loan_id', 'Loan ID'),
            ('member_name', 'Member'),
            ('member_id', 'Member ID'),
            ('amount', 'Amount (K)'),
            ('interest', 'Interest (K)'),
            ('total_repayment', 'Total Repayment (K)'),
            ('duration', 'Duration (months)'),
            ('status', 'Status'),
            ('date_approved', 'Date Approved'),
        ]

        if format_type == 'csv':
            csv_data = ReportExportService.generate_csv(data, columns, 'loan_report')
            response = HttpResponse(csv_data, content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="loan_report.csv"'
            return response

        elif format_type == 'pdf':
            pdf_data = ReportExportService.generate_pdf(data, columns, 'Loan Report', 'loan_report')
            response = HttpResponse(pdf_data, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="loan_report.pdf"'
            return response

        return Response({'error': 'Invalid format'}, status=400)


class RepaymentReportExportView(APIView):
    """Export repayment report as CSV or PDF."""

    permission_classes = [IsAdminUser]

    def get(self, request, format_type):
        from repayments.models import Repayment

        queryset = Repayment.objects.select_related(
            'loan', 'loan__member', 'loan__member__user', 'schedule'
        ).all()

        data = [
            {
                'member_name': r.loan.member.user.get_full_name(),
                'member_id': r.loan.member.member_id,
                'loan_id': r.loan.loan_id,
                'expected_payment': float(r.schedule.expected_amount),
                'actual_payment': float(r.amount),
                'payment_date': r.payment_date.strftime('%Y-%m-%d'),
                'outstanding_balance': float(r.loan.outstanding_balance),
                'status': r.schedule.payment_status,
            }
            for r in queryset
        ]

        columns = [
            ('member_name', 'Member'),
            ('member_id', 'Member ID'),
            ('loan_id', 'Loan ID'),
            ('expected_payment', 'Expected (K)'),
            ('actual_payment', 'Actual (K)'),
            ('payment_date', 'Payment Date'),
            ('outstanding_balance', 'Outstanding (K)'),
            ('status', 'Status'),
        ]

        if format_type == 'csv':
            csv_data = ReportExportService.generate_csv(data, columns, 'repayment_report')
            response = HttpResponse(csv_data, content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="repayment_report.csv"'
            return response

        elif format_type == 'pdf':
            pdf_data = ReportExportService.generate_pdf(data, columns, 'Repayment Report', 'repayment_report')
            response = HttpResponse(pdf_data, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="repayment_report.pdf"'
            return response

        return Response({'error': 'Invalid format'}, status=400)
