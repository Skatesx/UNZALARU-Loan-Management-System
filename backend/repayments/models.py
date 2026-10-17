import uuid

from django.db import models

from loans.models import Loan
from users.models import User


class RepaymentSchedule(models.Model):
    """Individual installment in a loan repayment schedule."""

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PARTIALLY_PAID', 'Partially Paid'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
    ]

    installment_id = models.CharField(max_length=20, unique=True, editable=False)
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='schedules')
    installment_number = models.IntegerField()
    due_date = models.DateField()
    expected_amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='PENDING'
    )
    days_overdue = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'repayment schedule'
        verbose_name_plural = 'repayment schedules'
        ordering = ['loan', 'installment_number']
        unique_together = ['loan', 'installment_number']

    def __str__(self):
        return f'{self.installment_id} - Loan {self.loan.loan_id} - Installment {self.installment_number}'

    def save(self, *args, **kwargs):
        if not self.installment_id:
            self.installment_id = f'INS-{uuid.uuid4().hex[:8].upper()}'
        if self.remaining_amount is None:
            self.remaining_amount = self.expected_amount
        super().save(*args, **kwargs)


class Repayment(models.Model):
    """Individual payment record against a loan installment."""

    PAYMENT_MODE_CHOICES = [
        ('CASH', 'Cash'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('MOBILE_MONEY', 'Mobile Money'),
        ('CHEQUE', 'Cheque'),
        ('SALARY_DEDUCTION', 'Salary Deduction'),
        ('OTHER', 'Other'),
    ]

    repayment_id = models.CharField(max_length=20, unique=True, editable=False)
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='repayments')
    schedule = models.ForeignKey(
        RepaymentSchedule, on_delete=models.CASCADE, related_name='payments'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_mode = models.CharField(
        max_length=20, choices=PAYMENT_MODE_CHOICES, default='CASH',
        help_text='How the payment was made'
    )
    payment_date = models.DateTimeField(auto_now_add=True)
    recorded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'repayment'
        verbose_name_plural = 'repayments'
        ordering = ['-payment_date']

    def __str__(self):
        return f'{self.repayment_id} - Loan {self.loan.loan_id} - K{self.amount}'

    def save(self, *args, **kwargs):
        if not self.repayment_id:
            self.repayment_id = f'RPY-{uuid.uuid4().hex[:8].upper()}'
        super().save(*args, **kwargs)


class PayrollRun(models.Model):
    """A month's salary deductions, confirmed once payroll has run.

    UNZALARU sends payroll a deduction list (each member's installment plus
    arrears); after payroll runs, an admin confirms what was actually
    deducted, which records the repayments. Each month is confirmed once.
    """

    month = models.DateField(unique=True, help_text='First day of the payroll month')
    total_due = models.DecimalField(max_digits=14, decimal_places=2)
    total_deducted = models.DecimalField(max_digits=14, decimal_places=2)
    bank_amount = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True,
        help_text='Amount payroll remitted to the UNZALARU bank account, if entered',
    )
    notes = models.TextField(blank=True)
    confirmed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='payroll_runs'
    )
    confirmed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-month']

    def __str__(self):
        return f'Payroll deductions {self.month:%B %Y}'


class PayrollDeduction(models.Model):
    """What was due and what payroll deducted for one loan in a payroll run."""

    run = models.ForeignKey(PayrollRun, on_delete=models.CASCADE, related_name='deductions')
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='payroll_deductions')
    current_due = models.DecimalField(max_digits=12, decimal_places=2)
    arrears = models.DecimalField(max_digits=12, decimal_places=2)
    amount_due = models.DecimalField(max_digits=12, decimal_places=2)
    amount_deducted = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = ['run', 'loan']
        ordering = ['loan__member__member_id']
