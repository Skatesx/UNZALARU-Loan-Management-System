from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from members.models import Member
from users.permissions import IsAdminUser, IsOwnerOrAdmin

from .models import Loan, LoanApplication, LoanType
from .serializers import (
    ApproveApplicationSerializer,
    LoanApplicationCreateSerializer,
    LoanApplicationListSerializer,
    LoanApplicationSerializer,
    LoanListSerializer,
    LoanSerializer,
    LoanTypeSerializer,
    RejectApplicationSerializer,
)
from .services import LoanApplicationService


class LoanTypeViewSet(viewsets.ModelViewSet):
    """Loan type management endpoints (admin only)."""

    permission_classes = [IsAdminUser]
    queryset = LoanType.objects.all()
    serializer_class = LoanTypeSerializer
    search_fields = ['name']
    filterset_fields = ['is_active', 'interest_method']


class LoanApplicationViewSet(viewsets.ModelViewSet):
    """Loan application endpoints."""

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return LoanApplication.objects.select_related(
                'member', 'member__user', 'loan_type', 'reviewed_by'
            ).all()
        # Members can only see their own applications
        try:
            member = Member.objects.get(user=user)
            return LoanApplication.objects.select_related(
                'member', 'member__user', 'loan_type', 'reviewed_by'
            ).filter(member=member)
        except Member.DoesNotExist:
            return LoanApplication.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return LoanApplicationCreateSerializer
        if self.action == 'list':
            return LoanApplicationListSerializer
        if self.action == 'approve':
            return ApproveApplicationSerializer
        if self.action == 'reject':
            return RejectApplicationSerializer
        return LoanApplicationSerializer

    def perform_create(self, serializer):
        """Create loan application with business logic."""
        user = self.request.user
        member = Member.objects.get(user=user)
        loan_type = serializer.validated_data['loan_type']

        service = LoanApplicationService()
        application = service.create_application(
            member=member,
            loan_type=loan_type,
            requested_amount=serializer.validated_data['requested_amount'],
            duration_months=serializer.validated_data['duration_months'],
            purpose=serializer.validated_data['purpose'],
            employment_info=serializer.validated_data.get('current_employment_info', {}),
            income_info=serializer.validated_data.get('income_info', {}),
            obligations=serializer.validated_data.get('existing_loan_obligations', []),
        )
        # Return the created application
        serializer.instance = application

    @action(detail=True, methods=['put'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Approve a loan application."""
        application = self.get_object()
        serializer = ApproveApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            service = LoanApplicationService()
            loan = service.approve_application(application, request.user)
            return Response(
                LoanSerializer(loan).data,
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=['put'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        """Reject a loan application."""
        application = self.get_object()
        serializer = RejectApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            service = LoanApplicationService()
            application = service.reject_application(
                application, request.user, serializer.validated_data['reason']
            )
            return Response(
                LoanApplicationSerializer(application).data,
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=['put'])
    def cancel(self, request, pk=None):
        """Cancel a loan application (member only)."""
        application = self.get_object()

        # Check if user owns this application
        if request.user.role != 'ADMIN':
            try:
                member = Member.objects.get(user=request.user)
                if application.member != member:
                    return Response(
                        {'error': 'You can only cancel your own applications'},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except Member.DoesNotExist:
                return Response(
                    {'error': 'Member profile not found'},
                    status=status.HTTP_404_NOT_FOUND,
                )

        try:
            service = LoanApplicationService()
            application = service.cancel_application(application)
            return Response(
                LoanApplicationSerializer(application).data,
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class LoanViewSet(viewsets.ReadOnlyModelViewSet):
    """Loan listing and detail endpoints."""

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Loan.objects.select_related(
                'member', 'member__user', 'loan_type', 'approved_by'
            ).all()
        try:
            member = Member.objects.get(user=user)
            return Loan.objects.select_related(
                'member', 'member__user', 'loan_type', 'approved_by'
            ).filter(member=member)
        except Member.DoesNotExist:
            return Loan.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return LoanListSerializer
        return LoanSerializer

    @action(detail=True, methods=['get'])
    def schedule(self, request, pk=None):
        """Get repayment schedule for a loan."""
        loan = self.get_object()
        from repayments.models import RepaymentSchedule
        from repayments.serializers import RepaymentScheduleSerializer

        schedules = RepaymentSchedule.objects.filter(loan=loan).order_by('installment_number')
        serializer = RepaymentScheduleSerializer(schedules, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def repayments(self, request, pk=None):
        """Get repayment history for a loan."""
        loan = self.get_object()
        from repayments.models import Repayment
        from repayments.serializers import RepaymentSerializer

        repayments = Repayment.objects.filter(loan=loan).order_by('-payment_date')
        serializer = RepaymentSerializer(repayments, many=True)
        return Response(serializer.data)
