"""API for monthly salary deductions (see payroll.py)."""
from decimal import Decimal, InvalidOperation

from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from reports.services import ReportExportService
from users.permissions import IsAdminUser, IsStaffUser

from .models import PayrollRun
from .payroll import (
    confirm_month,
    confirmed_rows,
    deduction_schedule,
    match_return,
    parse_month,
    read_payroll_return,
    totals,
)

MONEY_KEYS = ('current_due', 'arrears', 'amount_due', 'amount_deducted', 'amount')


def _money(value):
    return f'{value:.2f}'


def _rows(rows):
    return [{k: (_money(v) if k in MONEY_KEYS else v) for k, v in row.items()} for row in rows]


def _totals(values):
    return {k: (v if k == 'members' else _money(v)) for k, v in values.items()}


def _month(request_data):
    return parse_month(request_data.get('month'))


class PayrollDeductionListView(APIView):
    """GET ?month=YYYY-MM: the month's salary deduction list, or the confirmed run."""

    permission_classes = [IsStaffUser]

    def get(self, request):
        try:
            month = _month(request.query_params)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        run = PayrollRun.objects.filter(month=month).select_related('confirmed_by').first()
        if run:
            rows = confirmed_rows(run)
            return Response({
                'month': month.strftime('%Y-%m'),
                'confirmed': True,
                'run': {
                    'confirmed_by': run.confirmed_by.get_full_name() if run.confirmed_by else None,
                    'confirmed_at': run.confirmed_at,
                    'total_due': _money(run.total_due),
                    'total_deducted': _money(run.total_deducted),
                    'bank_amount': _money(run.bank_amount) if run.bank_amount is not None else None,
                    'notes': run.notes,
                },
                'rows': _rows(rows),
                'totals': _totals(totals(rows, 'amount_deducted')),
            })

        rows = deduction_schedule(month)
        return Response({
            'month': month.strftime('%Y-%m'),
            'confirmed': False,
            'run': None,
            'rows': _rows(rows),
            'totals': _totals(totals(rows)),
        })


class PayrollDeductionExportView(APIView):
    """GET csv | pdf: the deduction list to send to payroll.
    GET template: a payroll return pre-filled with the amounts due, to edit and upload.
    """

    permission_classes = [IsStaffUser]

    def get(self, request, format_type):
        try:
            month = _month(request.query_params)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        rows = _rows(deduction_schedule(month))
        stamp = month.strftime('%Y_%m')

        if format_type == 'template':
            data = [
                {'member_id': r['member_id'], 'member_name': r['member_name'],
                 'amount_deducted': r['amount_due']}
                for r in rows
            ]
            columns = [
                ('member_id', 'MAN Number'),
                ('member_name', 'Name'),
                ('amount_deducted', 'Amount Deducted'),
            ]
            response = HttpResponse(
                ReportExportService.generate_csv(data, columns, 'payroll_return'),
                content_type='text/csv',
            )
            response['Content-Disposition'] = f'attachment; filename="payroll_return_{stamp}.csv"'
            return response

        columns = [
            ('member_id', 'MAN Number'),
            ('member_name', 'Name'),
            ('school', 'School / Faculty'),
            ('department', 'Department'),
            ('current_due', 'This Month (K)'),
            ('arrears', 'Arrears (K)'),
            ('amount_due', 'Total to Deduct (K)'),
        ]
        if format_type == 'csv':
            response = HttpResponse(
                ReportExportService.generate_csv(rows, columns, 'payroll_deductions'),
                content_type='text/csv',
            )
            response['Content-Disposition'] = f'attachment; filename="payroll_deductions_{stamp}.csv"'
            return response
        if format_type == 'pdf':
            pdf = ReportExportService.generate_pdf(
                rows, columns, f'Salary Deductions - {month:%B %Y}', 'payroll_deductions'
            )
            response = HttpResponse(pdf, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="payroll_deductions_{stamp}.pdf"'
            return response
        return Response({'error': 'Invalid format'}, status=status.HTTP_400_BAD_REQUEST)


class PayrollReturnMatchView(APIView):
    """POST multipart {month, file}: compare payroll's return with the list. Nothing is saved."""

    permission_classes = [IsAdminUser]

    def post(self, request):
        upload = request.FILES.get('file')
        if upload is None:
            return Response({'error': 'Choose the payroll return file to upload'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            month = _month(request.data)
            result = match_return(month, read_payroll_return(upload))
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'month': month.strftime('%Y-%m'),
            'rows': _rows(result['rows']),
            'unknown': _rows(result['unknown']),
            'file_total': _money(result['file_total']),
            'totals': _totals(result['totals']),
        })


class PayrollConfirmView(APIView):
    """POST {month, deductions: [{loan_id, amount_deducted}], bank_amount?, notes?}."""

    permission_classes = [IsAdminUser]

    def post(self, request):
        try:
            month = _month(request.data)
            entries = request.data.get('deductions') or []
            deductions = {e['loan_id']: e.get('amount_deducted', 0) for e in entries}
            bank = request.data.get('bank_amount')
            bank_amount = Decimal(str(bank)) if bank not in (None, '') else None
            run = confirm_month(
                month, deductions, request.user,
                bank_amount=bank_amount, notes=request.data.get('notes', '') or '',
            )
        except (KeyError, TypeError, AttributeError, InvalidOperation):
            return Response({'error': 'Send deductions as a list of {loan_id, amount_deducted}'},
                            status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'month': month.strftime('%Y-%m'),
            'total_due': _money(run.total_due),
            'total_deducted': _money(run.total_deducted),
        }, status=status.HTTP_201_CREATED)
