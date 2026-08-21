import random
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from eligibility.models import EligibilityRule, EligibilityScore
from loans.models import Loan, LoanApplication, LoanType
from members.models import Member
from notifications.models import Notification
from repayments.models import Repayment, RepaymentSchedule
from users.models import User


class Command(BaseCommand):
    help = 'Load seed data for the UNZALARU Loan Management System'

    def handle(self, *args, **options):
        self.stdout.write('Loading seed data...')

        # Create admin user
        admin_user, created = User.objects.get_or_create(
            email='admin@unzalaru.com',
            defaults={
                'username': 'admin',
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('password123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Created admin user: admin@unzalaru.com'))
        else:
            self.stdout.write('Admin user already exists')

        # Create loan types
        loan_types = []
        loan_type_data = [
            {
                'name': 'Emergency Loan',
                'description': 'Short-term emergency loan for urgent needs',
                'min_amount': 1000,
                'max_amount': 10000,
                'min_duration_months': 3,
                'max_duration_months': 6,
                'interest_rate': 12,
                'interest_method': 'FLAT',
                'allow_multiple_active': False,
            },
            {
                'name': 'Development Loan',
                'description': 'Medium-term loan for personal development',
                'min_amount': 5000,
                'max_amount': 50000,
                'min_duration_months': 6,
                'max_duration_months': 24,
                'interest_rate': 15,
                'interest_method': 'FLAT',
                'allow_multiple_active': False,
            },
            {
                'name': 'Education Loan',
                'description': 'Loan for educational purposes',
                'min_amount': 2000,
                'max_amount': 30000,
                'min_duration_months': 6,
                'max_duration_months': 36,
                'interest_rate': 10,
                'interest_method': 'REDUCING_BALANCE',
                'allow_multiple_active': False,
            },
            {
                'name': 'Housing Loan',
                'description': 'Long-term housing loan',
                'min_amount': 20000,
                'max_amount': 200000,
                'min_duration_months': 12,
                'max_duration_months': 60,
                'interest_rate': 8,
                'interest_method': 'REDUCING_BALANCE',
                'allow_multiple_active': False,
            },
        ]

        for data in loan_type_data:
            lt, created = LoanType.objects.get_or_create(
                name=data['name'], defaults=data
            )
            loan_types.append(lt)
            if created:
                self.stdout.write(f'Created loan type: {lt.name}')

        # Create eligibility rules
        eligibility_rules = [
            {
                'name': 'Income Score',
                'factor': 'INCOME',
                'weight': 30,
                'thresholds': [
                    {'min': 0, 'max': 3000, 'score': 20},
                    {'min': 3001, 'max': 8000, 'score': 50},
                    {'min': 8001, 'max': 15000, 'score': 75},
                    {'min': 15001, 'max': None, 'score': 100},
                ],
            },
            {
                'name': 'Employment Stability',
                'factor': 'EMPLOYMENT',
                'weight': 25,
                'thresholds': [
                    {'min': 0, 'max': 30, 'score': 30},
                    {'min': 31, 'max': 60, 'score': 60},
                    {'min': 61, 'max': 100, 'score': 100},
                ],
            },
            {
                'name': 'Existing Obligations',
                'factor': 'OBLIGATIONS',
                'weight': 25,
                'thresholds': [
                    {'min': 0, 'max': 0, 'score': 100},
                    {'min': 1, 'max': 1, 'score': 70},
                    {'min': 2, 'max': 2, 'score': 40},
                    {'min': 3, 'max': 100, 'score': 10},
                ],
            },
            {
                'name': 'Repayment History',
                'factor': 'REPAYMENT_HISTORY',
                'weight': 20,
                'thresholds': [
                    {'min': 0, 'max': 25, 'score': 10},
                    {'min': 26, 'max': 50, 'score': 30},
                    {'min': 51, 'max': 75, 'score': 60},
                    {'min': 76, 'max': 100, 'score': 100},
                ],
            },
        ]

        for data in eligibility_rules:
            rule, created = EligibilityRule.objects.get_or_create(
                factor=data['factor'], defaults=data
            )
            if created:
                self.stdout.write(f'Created eligibility rule: {rule.name}')

        # Create member users
        departments = [
            'Computer Science', 'Mathematics', 'Physics', 'Chemistry',
            'Biology', 'Economics', 'Business', 'Engineering',
            'Law', 'Medicine', 'Education', 'Arts',
        ]
        employment_statuses = ['PERMANENT', 'CONTRACT', 'PART_TIME']
        first_names = [
            'John', 'Mary', 'Peter', 'Grace', 'David', 'Sarah', 'James',
            'Ruth', 'Michael', 'Hannah', 'Joseph', 'Elizabeth', 'Daniel',
            'Martha', 'Samuel', 'Naomi', 'Stephen', 'Lydia', 'Andrew',
            'Esther', 'Patrick', 'Priscilla', 'Thomas', 'Rebecca', 'Paul',
            'Deborah', 'Mark', 'Rachel', 'Luke', 'Joanna', 'Timothy',
            'Abigail', 'Philip', 'Hannah', 'Nathaniel', 'Ruth', 'Benjamin',
            'Deborah', 'Isaac', 'Rachel', 'Simon', 'Sarah', 'Jacob', 'Naomi',
        ]
        last_names = [
            'Moyo', 'Banda', 'Phiri', 'Mulenga', 'Chanda', 'Tembo',
            'Nyongesa', 'Kapenda', 'Sakala', 'Mwamba', 'Lungu', 'Mubita',
            'Kunda', 'Shimwili', 'Nkonde', 'Chilufya', 'Mwaamba', 'Bwalya',
            'Mwila', 'Katongo', 'Sichilima', 'Mumbi', 'Kasongo', 'Nsokimieno',
        ]

        members = []
        for i in range(30):
            first = random.choice(first_names)
            last = random.choice(last_names)
            email = f'{first.lower()}.{last.lower()}{i}@unzalaru.com'

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': first,
                    'last_name': last,
                    'role': 'MEMBER',
                }
            )
            if created:
                user.set_password('password123')
                user.save()

            income = random.randint(3000, 25000)
            emp_status = random.choice(employment_statuses)

            member, created = Member.objects.get_or_create(
                user=user,
                defaults={
                    'nrc_number': f'NRC-{random.randint(100000, 999999)}',
                    'phone_number': f'+260{random.randint(700000000, 799999999)}',
                    'address': f'{random.randint(1, 100)} University Road, Lusaka',
                    'department': random.choice(departments),
                    'employment_status': emp_status,
                    'monthly_income': income,
                }
            )
            members.append(member)

        self.stdout.write(self.style.SUCCESS(f'Created {len(members)} members'))

        # Create loan applications and loans
        statuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
        applications_created = 0
        loans_created = 0

        for member in members:
            # Each member gets 1-3 applications
            num_apps = random.randint(1, 3)
            for _ in range(num_apps):
                loan_type = random.choice(loan_types)
                amount = random.randint(
                    int(loan_type.min_amount),
                    int(loan_type.max_amount)
                )
                duration = random.randint(
                    loan_type.min_duration_months,
                    loan_type.max_duration_months
                )

                status = random.choice(statuses)
                app = LoanApplication.objects.create(
                    member=member,
                    loan_type=loan_type,
                    requested_amount=amount,
                    duration_months=duration,
                    purpose=f'Personal loan for {random.choice(["education", "housing", "medical", "business", "emergency"])}',
                    status=status,
                    current_employment_info={
                        'employer': 'University of Zambia',
                        'position': random.choice(['Lecturer', 'Senior Lecturer', 'Professor', 'Researcher']),
                        'years': random.randint(1, 20),
                    },
                    income_info={
                        'monthly_salary': float(member.monthly_income),
                        'other_income': random.randint(0, 5000),
                    },
                )
                applications_created += 1

                # If approved, create a loan
                if status == 'APPROVED':
                    from loans.services import LoanCalculationService
                    calc = LoanCalculationService()
                    details = calc.calculate_loan(
                        principal=amount,
                        annual_rate=loan_type.interest_rate,
                        months=duration,
                        interest_method=loan_type.interest_method,
                    )

                    loan = Loan.objects.create(
                        application=app,
                        member=member,
                        loan_type=loan_type,
                        principal=details['principal'],
                        interest_rate=details['interest_rate'],
                        interest_method=details['interest_method'],
                        total_interest=details['total_interest'],
                        total_repayment=details['total_repayment'],
                        duration_months=details['duration_months'],
                        monthly_installment=details['monthly_installment'],
                        outstanding_balance=details['total_repayment'],
                        approved_by=admin_user,
                    )
                    loans_created += 1

                    # Create repayment schedule
                    start_date = date.today() - timedelta(days=random.randint(30, 180))
                    for i in range(1, duration + 1):
                        due_date = start_date + timedelta(days=30 * i)
                        days_overdue = max(0, (date.today() - due_date).days)

                        payment_status = 'PAID'
                        amount_paid = loan.monthly_installment
                        remaining = Decimal('0')

                        if days_overdue > 0:
                            if random.random() < 0.3:
                                payment_status = 'OVERDUE'
                                amount_paid = Decimal('0')
                                remaining = loan.monthly_installment
                            elif random.random() < 0.5:
                                payment_status = 'PARTIALLY_PAID'
                                amount_paid = loan.monthly_installment * Decimal(str(random.uniform(0.3, 0.9)))
                                remaining = loan.monthly_installment - amount_paid
                            else:
                                payment_status = 'PAID'
                        elif i > duration * 0.3:
                            # Some future installments still pending
                            if random.random() < 0.4:
                                payment_status = 'PENDING'
                                amount_paid = Decimal('0')
                                remaining = loan.monthly_installment

                        RepaymentSchedule.objects.create(
                            loan=loan,
                            installment_number=i,
                            due_date=due_date,
                            expected_amount=loan.monthly_installment,
                            amount_paid=amount_paid,
                            remaining_amount=remaining,
                            payment_status=payment_status,
                            days_overdue=days_overdue,
                        )

        self.stdout.write(self.style.SUCCESS(
            f'Created {applications_created} applications and {loans_created} loans'
        ))

        # Create sample notifications
        for member in random.sample(members, min(10, len(members))):
            Notification.objects.create(
                user=member.user,
                title='Welcome to UNZALARU',
                message='Welcome to the UNZALARU Loan Management System. You can now apply for loans online.',
                notification_type='STATUS_CHANGE',
            )

        self.stdout.write(self.style.SUCCESS('Loaded seed data successfully!'))
        self.stdout.write('')
        self.stdout.write('Admin login: admin@unzalaru.com / password123')
        self.stdout.write(f'Member logins: first.last@unzalaru.com / password123')
