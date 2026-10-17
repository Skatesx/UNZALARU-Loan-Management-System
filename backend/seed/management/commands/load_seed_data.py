import random
from datetime import date, datetime, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from config_app.models import SystemConfig
from eligibility.models import EligibilityRule, EligibilityScore
from loans.criteria import CRITERIA_KEY, DEFAULT_CRITERIA
from loans.models import Loan, LoanApplication, LoanType
from members.models import Member
from notifications.models import Notification
from repayments.models import PayrollRun, Repayment, RepaymentSchedule
from users.models import User

PAYMENT_MODES = ['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHEQUE', 'SALARY_DEDUCTION']


PENDING_MEMBER_EMAILS = [
    'chanda.mwansa@unzalaru.com',
    'mutale.chewe@unzalaru.com',
    'bupe.chisanga@unzalaru.com',
]


class Command(BaseCommand):
    help = 'Load seed data for the UNZALARU Loan Management System'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help=(
                'Delete existing loan applications, loans, repayments, payroll runs, '
                'notifications and audit entries, and return the demo pending '
                'members to PENDING, before loading fresh demo data'
            ),
        )

    def reset_demo_data(self):
        """Remove transactional data so the seed can be loaded again cleanly."""
        from audit.models import AuditLog

        # Deleting applications cascades to loans, eligibility scores,
        # repayment schedules, repayments and defaulter statuses.
        apps_deleted, _ = LoanApplication.objects.all().delete()
        Notification.objects.all().delete()
        AuditLog.objects.all().delete()
        PayrollRun.objects.all().delete()  # confirmed salary deduction months
        Member.objects.filter(user__email__in=PENDING_MEMBER_EMAILS).update(
            membership_status='PENDING',
            account_status='ACTIVE',
            approved_by=None,
            approval_date=None,
        )
        User.objects.filter(email__in=PENDING_MEMBER_EMAILS).update(is_active=True)
        self.stdout.write(self.style.WARNING(
            'Reset: removed existing applications, loans, repayments, payroll runs, '
            'notifications and audit entries'
        ))

    def use_man_number(self, member, man_number):
        """Move demo members off IDs that aren't 6-digit MAN numbers (old MBR- or 5-digit ones)."""
        if not (len(member.member_id) == 6 and member.member_id.isdigit()):
            member.member_id = man_number
            member.save(update_fields=['member_id'])

    def use_demo_school(self, member, school, department):
        """Give demo members created before the school field a school and department."""
        if not member.school:
            member.school = school
            member.department = department
            member.save(update_fields=['school', 'department'])

    def handle(self, *args, **options):
        self.stdout.write('Loading seed data...')
        if options['reset']:
            self.reset_demo_data()
        # Deterministic seed so demo logins (first.lastN@unzalaru.com) are
        # reproducible across runs — see README seed logins.
        random.seed(42)

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

        # Create supervisor user
        supervisor_user, created = User.objects.get_or_create(
            email='supervisor@unzalaru.com',
            defaults={
                'username': 'supervisor',
                'first_name': 'Grace',
                'last_name': 'Banda',
                'role': 'SUPERVISOR',
            }
        )
        if created:
            supervisor_user.set_password('password123')
            supervisor_user.save()
            self.stdout.write(self.style.SUCCESS('Created supervisor user: supervisor@unzalaru.com'))
        else:
            self.stdout.write('Supervisor user already exists')

        # UNZALARU offers a single flat loan; membership is the qualification
        flat_loan, created = LoanType.objects.update_or_create(
            name='Flat Loan',
            defaults={
                'description': (
                    'UNZALARU members qualify by membership. Borrow K10,000, '
                    'K15,000 or K20,000 at 10% interest charged once, repaid '
                    'over 1-12 months.'
                ),
                'min_amount': 10000,
                'max_amount': 20000,
                'allowed_amounts': [10000, 15000, 20000],
                'min_duration_months': 1,
                'max_duration_months': 12,
                'interest_rate': 10,
                'interest_method': 'FLAT_ONCE',
                'allow_multiple_active': False,
                'is_active': True,
            },
        )
        LoanType.objects.exclude(pk=flat_loan.pk).update(is_active=False)
        if created:
            self.stdout.write('Created loan product: Flat Loan')

        # Create eligibility rules
        eligibility_rules = [
            {
                # Fewer earlier applications score higher: first-timers get priority
                'name': 'Application History',
                'factor': 'APPLICATION_HISTORY',
                'weight': 30,
                'thresholds': [
                    {'min': 0, 'max': 0, 'score': 100},
                    {'min': 1, 'max': 1, 'score': 70},
                    {'min': 2, 'max': 2, 'score': 40},
                    {'min': 3, 'max': None, 'score': 10},
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

        # Default system configuration (loan approval criteria)
        SystemConfig.objects.get_or_create(
            key=CRITERIA_KEY,
            defaults={
                'value': DEFAULT_CRITERIA,
                'description': (
                    'Loan approval criteria evaluated before an admin can '
                    'approve an application. Admins may override with a reason.'
                ),
            }
        )
        self.stdout.write('Configured default loan approval criteria')

        # Create member users
        # (school / faculty, department) as members would enter them
        departments = [
            ('School of Natural Sciences', 'Computer Science'),
            ('School of Natural Sciences', 'Mathematics and Statistics'),
            ('School of Natural Sciences', 'Physics'),
            ('School of Natural Sciences', 'Chemistry'),
            ('School of Humanities and Social Sciences', 'Economics'),
            ('School of Humanities and Social Sciences', 'History'),
            ('Graduate School of Business', 'Business Administration'),
            ('School of Engineering', 'Civil and Environmental Engineering'),
            ('School of Law', 'Public Law'),
            ('School of Medicine', 'Internal Medicine'),
            ('School of Education', 'Mathematics and Science Education'),
            ('School of Nursing Sciences', 'Nursing'),
            ('School of Mines', 'Mining Engineering'),
        ]
        employment_statuses = ['PERMANENT', 'CONTRACT', 'PART_TIME']

        members = []
        # Deterministic (first, last) pairs so demo emails are predictable and
        # match the logins documented in the README (john.mwansa1@unzalaru.com).
        member_names = [
            ('Mary', 'Phiri'),      # mary.phiri0@unzalaru.com
            ('John', 'Mwansa'),     # john.mwansa1@unzalaru.com
            ('Grace', 'Banda'),
            ('David', 'Mulenga'),
            ('Sarah', 'Tembo'),
            ('James', 'Chanda'),
            ('Ruth', 'Phiri'),
            ('Michael', 'Mwansa'),
            ('Hannah', 'Banda'),
            ('Joseph', 'Tembo'),
            ('Elizabeth', 'Mulenga'),
            ('Daniel', 'Chanda'),
            ('Martha', 'Nyongesa'),
            ('Samuel', 'Kapenda'),
            ('Naomi', 'Sakala'),
            ('Stephen', 'Mwamba'),
            ('Lydia', 'Lungu'),
            ('Andrew', 'Mubita'),
            ('Esther', 'Kunda'),
            ('Patrick', 'Shimwili'),
            ('Priscilla', 'Nkonde'),
            ('Thomas', 'Chilufya'),
            ('Rebecca', 'Bwalya'),
            ('Paul', 'Mwila'),
            ('Deborah', 'Katongo'),
            ('Mark', 'Sichilima'),
            ('Rachel', 'Mumbi'),
            ('Luke', 'Kasongo'),
            ('Joanna', 'Nsokimieno'),
            ('Timothy', 'Zimba'),
        ]
        for i, (first, last) in enumerate(member_names):
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

            emp_status = random.choice(employment_statuses)

            member, created = Member.objects.get_or_create(
                user=user,
                defaults={
                    'member_id': str(102300 + i * 70),  # demo MAN number
                    'nrc_number': f'NRC-{random.randint(100000, 999999)}',
                    'phone_number': f'+260{random.randint(700000000, 799999999)}',
                    'address': f'{random.randint(1, 100)} University Road, Lusaka',
                    'school': departments[i % len(departments)][0],
                    'department': departments[i % len(departments)][1],
                    'employment_status': emp_status,
                    'membership_status': 'ACTIVE',
                }
            )
            self.use_man_number(member, str(102300 + i * 70))
            self.use_demo_school(member, *departments[i % len(departments)])
            members.append(member)

        self.stdout.write(self.style.SUCCESS(f'Created {len(members)} members'))

        # Create pending members awaiting approval
        pending_members = []
        pending_names = [
            ('Chanda', 'Mwansa', 'School of Education', 'Library and Information Science'),
            ('Mutale', 'Chewe', 'School of Veterinary Medicine', 'Clinical Studies'),
            ('Bupe', 'Chisanga', 'School of Engineering', 'Geomatic Engineering'),
        ]
        for idx, (first, last, school, dept) in enumerate(pending_names):
            email = f'{first.lower()}.{last.lower()}@unzalaru.com'
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

            member, created = Member.objects.get_or_create(
                user=user,
                defaults={
                    'member_id': str(301010 + idx),  # demo MAN number
                    'nrc_number': f'NRC-P{100000 + idx}',
                    'phone_number': f'+260{random.randint(700000000, 799999999)}',
                    'address': f'{random.randint(1, 100)} Great East Road, Lusaka',
                    'school': school,
                    'department': dept,
                    'employment_status': 'CONTRACT',
                    'membership_status': 'PENDING',
                }
            )
            self.use_man_number(member, str(301010 + idx))
            self.use_demo_school(member, school, dept)
            pending_members.append(member)

        self.stdout.write(self.style.SUCCESS(
            f'Created {len(pending_members)} pending members awaiting approval'
        ))

        # Loans, repayments and notifications are only created once; running
        # the command again would otherwise duplicate every member's loans.
        if LoanApplication.objects.exists():
            self.stdout.write(self.style.WARNING(
                'Loan data already exists, so no new applications, loans or '
                'repayments were created. Run with --reset to start over.'
            ))
            self.print_logins()
            return

        # Create loan applications and loans
        statuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
        applications_created = 0
        loans_created = 0
        today = date.today()

        for member in members:
            # Matches the default approval criteria: one active loan per member
            has_active_loan = False
            # Each member gets 1-3 applications
            num_apps = random.randint(1, 3)
            for _ in range(num_apps):
                loan_type = flat_loan
                amount = random.choice(loan_type.allowed_amounts)
                duration = random.randint(
                    loan_type.min_duration_months,
                    loan_type.max_duration_months
                )

                status = random.choice(statuses)
                if status == 'APPROVED' and has_active_loan:
                    status = 'REJECTED'
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
                    rejection_reason=(
                        'Member already has an active loan'
                        if status == 'REJECTED' else ''
                    ),
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
                    has_active_loan = True

                    # Backdate the loan so its schedule has some past installments
                    start_date = today - timedelta(days=random.randint(30, 180))
                    approved_at = timezone.make_aware(
                        datetime.combine(start_date, datetime.min.time())
                    ) + timedelta(hours=9)
                    LoanApplication.objects.filter(pk=app.pk).update(
                        application_date=approved_at - timedelta(days=3),
                        reviewed_by=admin_user,
                        reviewed_at=approved_at,
                    )
                    Loan.objects.filter(pk=loan.pk).update(
                        date_approved=approved_at, created_at=approved_at,
                    )

                    # The last installment absorbs cent rounding so the
                    # schedule adds up exactly to total_repayment
                    last_amount = (
                        loan.total_repayment
                        - loan.monthly_installment * (duration - 1)
                    )
                    total_paid = Decimal('0')

                    for i in range(1, duration + 1):
                        due_date = start_date + timedelta(days=30 * i)
                        expected = last_amount if i == duration else loan.monthly_installment
                        days_overdue = max(0, (today - due_date).days)

                        if due_date > today:
                            # Future installments haven't been paid yet
                            payment_status = 'PENDING'
                            amount_paid = Decimal('0')
                        elif random.random() < 0.15:
                            payment_status = 'OVERDUE'
                            amount_paid = Decimal('0')
                        elif random.random() < 0.15:
                            payment_status = 'PARTIALLY_PAID'
                            amount_paid = (
                                expected * Decimal(str(random.uniform(0.3, 0.9)))
                            ).quantize(Decimal('0.01'))
                        else:
                            payment_status = 'PAID'
                            amount_paid = expected

                        if payment_status == 'PAID':
                            days_overdue = 0

                        schedule = RepaymentSchedule.objects.create(
                            loan=loan,
                            installment_number=i,
                            due_date=due_date,
                            expected_amount=expected,
                            amount_paid=amount_paid,
                            remaining_amount=expected - amount_paid,
                            payment_status=payment_status,
                            days_overdue=days_overdue,
                        )

                        # Record payments for paid/partial installments,
                        # dated a few days around the due date
                        if amount_paid > 0:
                            repayment = Repayment.objects.create(
                                loan=loan,
                                schedule=schedule,
                                amount=amount_paid,
                                payment_mode=random.choice(PAYMENT_MODES),
                                recorded_by=admin_user,
                                notes='Seed data payment',
                            )
                            paid_at = timezone.make_aware(
                                datetime.combine(
                                    due_date - timedelta(days=random.randint(0, 5)),
                                    datetime.min.time(),
                                )
                            ) + timedelta(hours=random.randint(8, 16))
                            Repayment.objects.filter(pk=repayment.pk).update(
                                payment_date=paid_at, created_at=paid_at,
                            )
                            total_paid += amount_paid

                    # Keep the loan's running totals in line with its payments
                    loan.amount_repaid = total_paid
                    loan.outstanding_balance = loan.total_repayment - total_paid
                    if loan.outstanding_balance <= 0:
                        loan.outstanding_balance = Decimal('0')
                        loan.status = 'COMPLETED'
                    loan.save(update_fields=['amount_repaid', 'outstanding_balance', 'status'])

        self.stdout.write(self.style.SUCCESS(
            f'Created {applications_created} applications and {loans_created} loans'
        ))

        # Classify overdue installments so the Defaulters page has data
        from defaulters.services import DefaulterDetectionService
        DefaulterDetectionService().update_statuses()

        # Create sample notifications
        for member in random.sample(members, min(10, len(members))):
            Notification.objects.create(
                user=member.user,
                title='Welcome to UNZALARU',
                message='Welcome to the UNZALARU Loan Management System. You can now apply for loans online.',
                notification_type='STATUS_CHANGE',
            )

        self.stdout.write(self.style.SUCCESS('Loaded seed data successfully!'))
        self.print_logins()

    def print_logins(self):
        self.stdout.write('')
        self.stdout.write('Admin login: admin@unzalaru.com / password123')
        self.stdout.write('Supervisor login: supervisor@unzalaru.com / password123')
        self.stdout.write('Member logins (password123):')
        self.stdout.write('  john.mwansa1@unzalaru.com   (active, with loans)')
        self.stdout.write('  mary.phiri0@unzalaru.com    (active, with loans)')
        self.stdout.write('  grace.banda2@unzalaru.com   (active, with loans)')
        self.stdout.write('Pending member logins (awaiting approval): chanda.mwansa@unzalaru.com, mutale.chewe@unzalaru.com, bupe.chisanga@unzalaru.com / password123')
