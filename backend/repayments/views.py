from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from loans.models import Loan
from members.models import Member
from users.permissions import IsAdminUser

from .models import Repayment, RepaymentSchedule
from .serializers import (
    RepaymentCreateSerializer,
    RepaymentScheduleSerializer,
    RepaymentSerializer,
)
from .services import RepaymentService


class RepaymentViewSet(viewsets.ModelViewSet):
    """Repayment management endpoints."""

    permission_classes = [IsAdminUser]
    serializer_class = RepaymentSerializer
    search_fields = ['repayment_id', 'loan__loan_id', 'notes']
    ordering_fields = ['payment_date', 'amount']

    def get_queryset(self):
        return Repayment.objects.select_related(
            'loan', 'schedule', 'recorded_by'
        ).all()

    def get_serializer_class(self):
        if self.action == 'create':
            return RepaymentCreateSerializer
        return RepaymentSerializer

    def create(self, request, *args, **kwargs):
        """Record a new repayment."""
        serializer = RepaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            loan = Loan.objects.get(
                loan_id=serializer.validated_data['loan_id']
            )
        except Loan.DoesNotExist:
            return Response(
                {'error': 'Loan not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        schedule_id = serializer.validated_data.get('schedule_id')
        if schedule_id:
            try:
                schedule = RepaymentSchedule.objects.get(
                    installment_id=schedule_id, loan=loan
                )
            except RepaymentSchedule.DoesNotExist:
                return Response(
                    {'error': 'Schedule not found'},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            schedule = None

        try:
            service = RepaymentService()
            payments = service.record_payment(
                loan=loan,
                amount=serializer.validated_data['amount'],
                recorded_by=request.user,
                schedule_id=schedule.installment_id if schedule else None,
                notes=serializer.validated_data.get('notes', ''),
            )
            return Response(
                RepaymentSerializer(payments, many=True).data,
                status=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class RepaymentScheduleListView(generics.ListAPIView):
    """List repayment schedule for a specific loan."""

    permission_classes = [IsAuthenticated]
    serializer_class = RepaymentScheduleSerializer

    def get_queryset(self):
        loan_id = self.kwargs.get('loan_id')
        user = self.request.user

        if user.role == 'ADMIN':
            return RepaymentSchedule.objects.filter(
                loan__loan_id=loan_id
            ).select_related('loan')
        else:
            try:
                member = Member.objects.get(user=user)
                return RepaymentSchedule.objects.filter(
                    loan__loan_id=loan_id,
                    loan__member=member
                ).select_related('loan')
            except Member.DoesNotExist:
                return RepaymentSchedule.objects.none()
