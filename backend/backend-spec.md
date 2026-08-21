# UNZALARU Loan Management System — Backend Implementation Spec

## Overview

This spec defines the complete backend implementation for the UNZALARU Loan Management System. The backend is built with **Django REST Framework**, uses **PostgreSQL**, and implements JWT authentication. All business logic lives in dedicated service layers.

---

## Technology Stack

| Component | Technology |
|---|---|
| Framework | Django 5.x + Django REST Framework 3.x |
| Database | PostgreSQL 15+ |
| Python | 3.11+ |
| Package manager | uv |
| Authentication | JWT via `djangorestframework-simplejwt` |
| API docs | `drf-spectacular` (OpenAPI 3.0 + Swagger UI) |
| Filtering | `django-filter` |
| CORS | `django-cors-headers` |
| Testing | pytest + pytest-django + pytest-cov |
| Export | `reportlab` (PDF), `csv` (stdlib) |

### Package requirements (pyproject.toml dependencies)

```
django>=5.0
djangorestframework>=3.15
djangorestframework-simplejwt>=5.3
drf-spectacular>=0.27
django-cors-headers>=4.3
django-filter>=24.1
psycopg[binary]>=3.1
pytest>=8.0
pytest-django>=4.8
pytest-cov>=5.0
reportlab>=4.1
faker>=26.0
python-decouple>=3.8
```

---

## Project Structure

```
backend/
├── manage.py
├── pyproject.toml
├── .env.example
├── .env
├── pytest.ini
├── config/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   ├── asgi.py
│   └── celery.py          # Not used now, placeholder for future
├── users/
│   ├── __init__.py
│   ├── models.py           # User model (AbstractUser)
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── services.py
│   ├── signals.py
│   ├── admin.py
│   ├── tests/
│   │   ├── test_models.py
│   │   ├── test_api.py
│   │   └── test_services.py
│   └── management/
│       └── commands/
│           └── createsuperuser_custom.py
├── members/
│   ├── __init__.py
│   ├── models.py           # Member profile
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── services.py
│   ├── filters.py
│   ├── admin.py
│   └── tests/
├── loans/
│   ├── __init__.py
│   ├── models.py           # LoanType, LoanApplication, Loan
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── services.py         # Loan calculation engine
│   ├── filters.py
│   ├── admin.py
│   └── tests/
├── repayments/
│   ├── __init__.py
│   ├── models.py           # RepaymentSchedule, Repayment
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── services.py
│   ├── filters.py
│   ├── admin.py
│   └── tests/
├── eligibility/
│   ├── __init__.py
│   ├── models.py           # EligibilityRule, EligibilityScore
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── services.py         # Single EligibilityScoringService
│   ├── filters.py
│   ├── admin.py
│   └── tests/
├── defaulters/
│   ├── __init__.py
│   ├── models.py           # DefaulterStatus
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── services.py         # Defaulter detection service
│   ├── management/
│   │   └── commands/
│   │       └── update_defaulter_statuses.py
│   ├── admin.py
│   └── tests/
├── reports/
│   ├── __init__.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── services.py         # Report generation + CSV/PDF export
│   └── tests/
├── notifications/
│   ├── __init__.py
│   ├── models.py           # Notification
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── services.py
│   ├── admin.py
│   └── tests/
├── audit/
│   ├── __init__.py
│   ├── models.py           # AuditLog
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── middleware.py        # Auto-logging middleware
│   ├── signals.py          # DRF signal-based logging
│   ├── admin.py
│   └── tests/
├── config_app/             # System configuration module
│   ├── __init__.py
│   ├── models.py           # SystemConfig, LoanType config, etc.
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── services.py
│   └── tests/
└── seed/
    ├── __init__.py
    └── management/
        └── commands/
            └── load_seed_data.py
```

---

## Phase 1 — Foundation

### 1.1 Project Setup

- Initialize Django project with `django-admin startproject config backend/`
- Create apps: `users`, `members`, `loans`, `eligibility`, `repayments`, `defaulters`, `reports`, `notifications`, `audit`, `config_app`, `seed`
- Configure `settings.py`:
  - PostgreSQL database connection via `DATABASE_URL` env var
  - DRF default settings (pagination, permissions, authentication)
  - JWT settings (access token lifetime: 60 min, refresh: 7 days)
  - CORS settings from `CORS_ALLOWED_ORIGINS` env var
  - `drf-spectacular` as default schema class
  - `django-filter` backend in DRF settings
  - `AUTH_USER_MODEL = 'users.User'`
- Create `.env.example` with all required env vars

### 1.2 Environment Variables

```
DATABASE_URL=postgres://user:password@localhost:5432/unzalaru_db
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### 1.3 Custom User Model (`users/models.py`)

```python
class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=[
        ('MEMBER', 'Member'),
        ('ADMIN', 'Administrator'),
    ], default='MEMBER')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
```

- Password hashing via Django's built-in `make_password`/`check_password`
- Login via email + password

### 1.4 JWT Authentication

- Use `SimpleJWT` with:
  - `ACCESS_TOKEN_LIFETIME`: 60 minutes
  - `REFRESH_TOKEN_LIFETIME`: 7 days
  - `ROTATE_REFRESH_TOKENS`: True
  - `BLACKLIST_AFTER_ROTATION`: True
- Endpoints:
  - `POST /api/auth/login/` — returns access + refresh tokens
  - `POST /api/auth/refresh/` — refresh access token
  - `POST /api/auth/logout/` — blacklist refresh token
  - `POST /api/auth/password-change/` — change password (authenticated)
  - `POST /api/auth/password-reset-request/` — request reset (email)
  - `POST /api/auth/password-reset-confirm/` — confirm reset with token

### 1.5 Role-Based Permissions

Create custom DRF permissions:

```python
class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'

class IsMemberUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'MEMBER'

class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        return obj.user == request.user
```

### 1.6 Base API Structure

- `config/urls.py` includes all app URLs under `/api/`
- DRF router for ViewSets
- Swagger UI at `/api/docs/`
- ReDoc at `/api/redoc/`

### 1.7 Audit Trail Setup

- `AuditLog` model (see Section 42)
- Middleware captures admin actions
- DRF signals for automatic logging on create/update/delete of key models

---

## Phase 2 — Members

### 2.1 Member Model (`members/models.py`)

```python
class Member(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='member')
    member_id = models.CharField(max_length=20, unique=True, editable=False)
    nrc_number = models.CharField(max_length=20, unique=True)
    phone_number = models.CharField(max_length=20)
    address = models.TextField()
    department = models.CharField(max_length=100)
    employment_status = models.CharField(max_length=20, choices=[
        ('PERMANENT', 'Permanent'),
        ('CONTRACT', 'Contract'),
        ('PART_TIME', 'Part Time'),
        ('RETIRED', 'Retired'),
    ])
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2)
    date_joined = models.DateField(auto_now_add=True)
    membership_status = models.CharField(max_length=20, choices=[
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('SUSPENDED', 'Suspended'),
    ], default='ACTIVE')
    account_status = models.CharField(max_length=20, choices=[
        ('ACTIVE', 'Active'),
        ('DEACTIVATED', 'Deactivated'),
    ], default='ACTIVE')
```

### 2.2 Member Endpoints

| Method | URL | Access | Description |
|---|---|---|---|
| POST | `/api/members/` | Admin | Create member |
| GET | `/api/members/` | Admin | List all members |
| GET | `/api/members/{id}/` | Admin/Owner | View member |
| PUT | `/api/members/{id}/` | Admin | Update member |
| PATCH | `/api/members/{id}/` | Admin | Partial update member |
| GET | `/api/members/{id}/loan-history/` | Admin/Owner | Member loan history |
| GET | `/api/members/{id}/repayment-history/` | Admin/Owner | Member repayment history |
| GET | `/api/members/{id}/eligibility-history/` | Admin | Eligibility score history |
| GET | `/api/members/{id}/defaulter-history/` | Admin | Defaulter classification history |
| GET | `/api/members/search/` | Admin | Search members (name, ID, department) |

### 2.3 Member Filters

- `name` (partial, case-insensitive)
- `department`
- `employment_status`
- `membership_status`
- `account_status`
- `date_joined` range

---

## Phase 3 — Loans

### 3.1 LoanType Model (`loans/models.py`)

```python
class LoanType(models.Model):
    name = models.CharField(max_length=100)  # e.g., "Emergency Loan", "Development Loan"
    description = models.TextField()
    min_amount = models.DecimalField(max_digits=12, decimal_places=2)
    max_amount = models.DecimalField(max_digits=12, decimal_places=2)
    min_duration_months = models.IntegerField()
    max_duration_months = models.IntegerField()
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)  # percentage
    interest_method = models.CharField(max_length=20, choices=[
        ('FLAT', 'Flat Rate'),
        ('REDUCING_BALANCE', 'Reducing Balance'),
    ], default='FLAT')
    allow_multiple_active = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 3.2 LoanApplication Model

```python
class LoanApplication(models.Model):
    application_id = models.CharField(max_length=20, unique=True, editable=False)
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='applications')
    loan_type = models.ForeignKey(LoanType, on_delete=models.PROTECT)
    requested_amount = models.DecimalField(max_digits=12, decimal_places=2)
    duration_months = models.IntegerField()
    purpose = models.TextField()
    application_date = models.DateTimeField(auto_now_add=True)
    current_employment_info = models.JSONField(default=dict)
    income_info = models.JSONField(default=dict)
    existing_loan_obligations = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'),
        ('UNDER_REVIEW', 'Under Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ], default='PENDING')
    rejection_reason = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    reviewed_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 3.3 Loan Model (created on approval)

```python
class Loan(models.Model):
    loan_id = models.CharField(max_length=20, unique=True, editable=False)
    application = models.OneToOneField(LoanApplication, on_delete=models.CASCADE, related_name='loan')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='loans')
    loan_type = models.ForeignKey(LoanType, on_delete=models.PROTECT)
    principal = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    interest_method = models.CharField(max_length=20)
    total_interest = models.DecimalField(max_digits=12, decimal_places=2)
    total_repayment = models.DecimalField(max_digits=12, decimal_places=2)
    duration_months = models.IntegerField()
    monthly_installment = models.DecimalField(max_digits=12, decimal_places=2)
    amount_repaid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=[
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('DEFAULTED', 'Defaulted'),
        ('WRITTEN_OFF', 'Written Off'),
    ], default='ACTIVE')
    date_approved = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 3.4 Loan Calculation Service (`loans/services.py`)

```python
class LoanCalculationService:
    """Centralized loan calculation engine."""

    @staticmethod
    def calculate_flat_interest(principal, annual_rate, months):
        """Flat rate: interest = principal × rate × (months/12)"""
        total_interest = principal * (annual_rate / 100) * (months / 12)
        return total_interest

    @staticmethod
    def calculate_reducing_balance_interest(principal, annual_rate, months):
        """Reducing balance: EMI using standard amortization formula."""
        monthly_rate = annual_rate / 100 / 12
        if monthly_rate == 0:
            return principal / months
        emi = principal * (monthly_rate * (1 + monthly_rate)**months) / (
            (1 + monthly_rate)**months - 1
        )
        total = emi * months
        return total - principal

    @staticmethod
    def calculate_monthly_installment(principal, total_interest, months):
        """Divide total repayment equally across installments."""
        total = principal + total_interest
        return total / months

    @staticmethod
    def generate_installment_dates(start_date, months):
        """Generate monthly due dates."""
        dates = []
        current = start_date
        for _ in range(months):
            # Add one month
            if current.month == 12:
                next_date = current.replace(year=current.year + 1, month=1)
            else:
                next_date = current.replace(month=current.month + 1)
            dates.append(next_date)
            current = next_date
        return dates
```

- Calculation is done via the service, never duplicated in views.
- Interest method is read from the `LoanType` model.

### 3.5 Loan Application Workflow

1. Member submits `POST /api/loan-applications/`
2. System validates:
   - Member is active
   - Requested amount within loan type limits
   - Duration within loan type limits
   - No duplicate pending application for same loan type
   - Member does not have active loan if `allow_multiple_active` is False
3. Eligibility score is calculated and attached to application
4. Application status set to `PENDING`
5. Admin reviews (`PUT /api/loan-applications/{id}/approve/` or `/reject/`)
6. On approval:
   - `Loan` record created
   - Repayment schedule generated
   - In-system notification sent to member
7. On rejection:
   - Rejection reason recorded
   - Status set to `REJECTED`
   - In-system notification sent to member

### 3.6 Loan Endpoints

| Method | URL | Access | Description |
|---|---|---|---|
| POST | `/api/loan-applications/` | Member | Submit application |
| GET | `/api/loan-applications/` | Admin: all / Member: own | List applications |
| GET | `/api/loan-applications/{id}/` | Admin/Owner | View application |
| PUT | `/api/loan-applications/{id}/approve/` | Admin | Approve application |
| PUT | `/api/loan-applications/{id}/reject/` | Admin | Reject application |
| PUT | `/api/loan-applications/{id}/cancel/` | Member (own) | Cancel application |
| GET | `/api/loans/` | Admin: all / Member: own | List loans |
| GET | `/api/loans/{id}/` | Admin/Owner | View loan details |
| GET | `/api/loans/{id}/schedule/` | Admin/Owner | View repayment schedule |

---

## Phase 4 — Eligibility Scoring

### 4.1 EligibilityRule Model (`eligibility/models.py`)

```python
class EligibilityRule(models.Model):
    name = models.CharField(max_length=100)  # e.g., "Income Score", "Employment Score"
    factor = models.CharField(max_length=50, choices=[
        ('INCOME', 'Income'),
        ('EMPLOYMENT', 'Employment Stability'),
        ('OBLIGATIONS', 'Existing Obligations'),
        ('REPAYMENT_HISTORY', 'Repayment History'),
    ])
    weight = models.DecimalField(max_digits=5, decimal_places=2)  # e.g., 30.00 for 30%
    thresholds = models.JSONField(default=list)
    # Example thresholds: [
    #   {"min": 0, "max": 5000, "score": 20},
    #   {"min": 5001, "max": 10000, "score": 60},
    #   {"min": 10001, "max": null, "score": 100}
    # ]
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class EligibilityScore(models.Model):
    application = models.OneToOneField(LoanApplication, on_delete=models.CASCADE, related_name='eligibility')
    total_score = models.DecimalField(max_digits=5, decimal_places=2)  # 0-100
    breakdown = models.JSONField(default=dict)  # {"income": 25, "employment": 20, ...}
    recommendation = models.CharField(max_length=20, choices=[
        ('ELIGIBLE', 'Eligible'),
        ('REVIEW', 'Review'),
        ('NOT_ELIGIBLE', 'Not Eligible'),
    ])
    reasons = models.JSONField(default=list)
    calculated_at = models.DateTimeField(auto_now_add=True)
```

### 4.2 Eligibility Scoring Service (`eligibility/services.py`)

```python
class EligibilityScoringService:
    """Single service class that orchestrates all factor scoring."""

    def calculate(self, application: LoanApplication) -> EligibilityScore:
        """
        1. Load all active EligibilityRule objects
        2. For each factor, calculate the score based on thresholds
        3. Apply weights
        4. Sum weighted scores to get total
        5. Determine recommendation based on thresholds
        6. Generate reasons
        """
        rules = EligibilityRule.objects.filter(is_active=True)
        breakdown = {}
        reasons = []

        for rule in rules:
            score = self._score_factor(rule, application)
            weighted = score * (rule.weight / 100)
            breakdown[rule.factor] = weighted
            reasons.extend(self._generate_reasons(rule, score))

        total = sum(breakdown.values())
        recommendation = self._get_recommendation(total)

        return EligibilityScore.objects.create(
            application=application,
            total_score=total,
            breakdown=breakdown,
            recommendation=recommendation,
            reasons=reasons,
        )

    def _score_factor(self, rule, application):
        """Score a single factor based on its thresholds."""
        value = self._get_factor_value(rule.factor, application)
        for threshold in rule.thresholds:
            if threshold['min'] <= value <= (threshold['max'] or float('inf')):
                return threshold['score']
        return 0

    def _get_factor_value(self, factor, application):
        """Extract the raw value for a factor from the application."""
        if factor == 'INCOME':
            return float(application.member.monthly_income)
        elif factor == 'EMPLOYMENT':
            return self._employment_score(application.member)
        elif factor == 'OBLIGATIONS':
            return self._obligations_score(application)
        elif factor == 'REPAYMENT_HISTORY':
            return self._repayment_history_score(application.member)
        return 0

    def _repayment_history_score(self, member):
        """
        If member has no loan history → neutral score (50/100).
        Otherwise, calculate from actual repayment performance.
        """
        loans = member.loans.all()
        if not loans.exists():
            return 50  # Neutral for first-time borrowers
        # Calculate based on percentage of on-time payments
        ...

    def _get_recommendation(self, total_score):
        if total_score >= 70:
            return 'ELIGIBLE'
        elif total_score >= 40:
            return 'REVIEW'
        return 'NOT_ELIGIBLE'
```

**Key requirement:** First-time borrowers (no loan history) get a **neutral repayment score of 50** — not penalized for lack of history.

### 4.3 Eligibility Endpoints

| Method | URL | Access | Description |
|---|---|---|---|
| GET | `/api/eligibility/{application_id}/` | Admin/Owner | View eligibility score |
| GET | `/api/eligibility/rules/` | Admin | List scoring rules |
| PUT | `/api/eligibility/rules/{id}/` | Admin | Update scoring rule |
| POST | `/api/eligibility/recalculate/{application_id}/` | Admin | Recalculate score |

---

## Phase 5 — Repayments

### 5.1 RepaymentSchedule Model (`repayments/models.py`)

```python
class RepaymentSchedule(models.Model):
    installment_id = models.CharField(max_length=20, unique=True, editable=False)
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='schedules')
    installment_number = models.IntegerField()
    due_date = models.DateField()
    expected_amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'),
        ('PARTIALLY_PAID', 'Partially Paid'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
    ], default='PENDING')
    days_overdue = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Repayment(models.Model):
    repayment_id = models.CharField(max_length=20, unique=True, editable=False)
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='repayments')
    schedule = models.ForeignKey(RepaymentSchedule, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 5.2 Repayment Recording Service (`repayments/services.py`)

```python
class RepaymentService:
    """Handles repayment recording and balance updates."""

    def record_payment(self, loan, amount, recorded_by, schedule_id=None, notes=''):
        """
        1. Validate loan is active
        2. Validate payment amount > 0
        3. If schedule_id provided, apply to specific installment
        4. Otherwise, apply to oldest outstanding installment(s)
        5. Handle partial payments (spread across installments)
        6. Handle overpayment (apply to next installment)
        7. Update installment status
        8. Update loan amount_repaid and outstanding_balance
        9. If fully repaid, mark loan as COMPLETED
        10. Recalculate defaulter status
        11. Update member repayment history
        12. Create audit log entry
        """
        ...

    def _apply_payment_to_installment(self, schedule, amount):
        """Apply payment to a single installment, handling partial payment."""
        ...

    def _update_loan_status(self, loan):
        """Check if loan is fully repaid and update status."""
        if loan.outstanding_balance <= 0:
            loan.status = 'COMPLETED'
            loan.save()
```

### 5.3 Repayment Endpoints

| Method | URL | Access | Description |
|---|---|---|---|
| POST | `/api/repayments/` | Admin | Record repayment |
| GET | `/api/repayments/` | Admin | List all repayments |
| GET | `/api/repayments/{id}/` | Admin/Owner | View repayment detail |
| GET | `/api/loans/{id}/repayments/` | Admin/Owner | Repayments for a loan |
| GET | `/api/loans/{id}/schedule/` | Admin/Owner | Repayment schedule for a loan |

---

## Phase 6 — Defaulters

### 6.1 DefaulterStatus Model (`defaulters/models.py`)

```python
class DefaulterStatus(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='defaulter_statuses')
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='defaulter_statuses')
    schedule = models.ForeignKey(RepaymentSchedule, on_delete=models.CASCADE)
    days_overdue = models.IntegerField()
    classification = models.CharField(max_length=20, choices=[
        ('CURRENT', 'Current'),
        ('AT_RISK', 'At Risk'),
        ('DEFAULTER', 'Defaulter'),
        ('SEVERE_DEFAULTER', 'Severe Defaulter'),
    ])
    last_checked = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### 6.2 Defaulter Detection Service (`defaulters/services.py`)

```python
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
        1. Find all active loans with pending/overdue installments
        2. Calculate days overdue for each installment
        3. Classify based on thresholds
        4. Create/update DefaulterStatus records
        """
        ...

    def calculate_days_overdue(self, due_date):
        """Return max(0, (today - due_date).days)"""
        ...

    def classify(self, days_overdue):
        for classification, (min_days, max_days) in self.CLASSIFICATION_THRESHOLDS.items():
            if min_days <= days_overdue <= max_days:
                return classification
        return 'SEVERE_DEFAULTER'
```

### 6.3 Management Command

```python
# defaulters/management/commands/update_defaulter_statuses.py
class Command(BaseCommand):
    help = 'Update defaulter classifications for all active loans'

    def handle(self, *args, **options):
        service = DefaulterDetectionService()
        updated = service.update_statuses()
        self.stdout.write(f'Updated {updated} defaulter statuses')
```

### 6.4 Defaulter Endpoints

| Method | URL | Access | Description |
|---|---|---|---|
| GET | `/api/defaulters/` | Admin | List all defaulters |
| GET | `/api/defaulters/?classification=AT_RISK` | Admin | Filter by classification |
| GET | `/api/defaulters/{id}/` | Admin | View defaulter detail |
| POST | `/api/defaulters/update/` | Admin | Trigger manual update |
| GET | `/api/defaulters/member/{member_id}/` | Admin | Member defaulter history |

---

## Phase 7 — Reporting & Dashboards

### 7.1 Admin Dashboard Endpoints

| Method | URL | Access | Description |
|---|---|---|---|
| GET | `/api/dashboard/admin/summary/` | Admin | Summary cards data |
| GET | `/api/dashboard/admin/charts/loans-over-time/` | Admin | Loans issued over time |
| GET | `/api/dashboard/admin/charts/repayments-over-time/` | Admin | Repayments over time |
| GET | `/api/dashboard/admin/charts/loan-status-distribution/` | Admin | Loan status pie chart |
| GET | `/api/dashboard/admin/charts/application-distribution/` | Admin | Approve/reject distribution |
| GET | `/api/dashboard/admin/charts/defaulters-by-classification/` | Admin | Defaulter breakdown |
| GET | `/api/dashboard/admin/charts/outstanding-amounts/` | Admin | Outstanding amounts |

### 7.2 Member Dashboard Endpoints

| Method | URL | Access | Description |
|---|---|---|---|
| GET | `/api/dashboard/member/` | Member | Member summary |

Response shape:
```json
{
  "eligibility_score": 82,
  "current_loan": { ... },
  "outstanding_balance": 5000,
  "next_payment": { "amount": 2200, "due_date": "2026-09-15" },
  "borrower_status": "CURRENT",
  "loan_applications_count": 3,
  "loan_history_count": 2
}
```

### 7.3 Report Endpoints

| Method | URL | Access | Description |
|---|---|---|---|
| GET | `/api/reports/loans/` | Admin | Loan report |
| GET | `/api/reports/repayments/` | Admin | Repayment report |
| GET | `/api/reports/defaulters/` | Admin | Defaulter report |
| GET | `/api/reports/eligibility/` | Admin | Eligibility report |
| GET | `/api/reports/loans/export/csv/` | Admin | Export loans CSV |
| GET | `/api/reports/loans/export/pdf/` | Admin | Export loans PDF |
| GET | `/api/reports/repayments/export/csv/` | Admin | Export repayments CSV |
| GET | `/api/reports/repayments/export/pdf/` | Admin | Export repayments PDF |

### 7.4 Report Filters

All report endpoints support:
- `date_from` / `date_to`
- `member_id`
- `loan_status`
- `defaulter_status`
- `application_status`

### 7.5 Export Service (`reports/services.py`)

```python
class ReportExportService:
    @staticmethod
    def generate_csv(queryset, columns, filename):
        """Generate CSV file from queryset."""
        ...

    @staticmethod
    def generate_pdf(data, title, columns, filename):
        """Generate PDF report using reportlab."""
        ...
```

---

## Phase 8 — Testing & Refinement

### 8.1 Test Structure

```
tests/
├── conftest.py              # Shared fixtures
├── factories.py             # Factory Boy factories (if added later)
├── test_auth.py             # Authentication tests
├── test_members.py          # Member CRUD tests
├── test_loans.py            # Loan application workflow tests
├── test_eligibility.py      # Eligibility scoring tests
├── test_repayments.py       # Repayment recording tests
├── test_defaulters.py       # Defaulter detection tests
├── test_reports.py          # Report generation tests
├── test_notifications.py    # Notification tests
├── test_audit.py            # Audit trail tests
└── integration/
    └── test_loan_lifecycle.py  # End-to-end loan lifecycle test
```

### 8.2 Key Test Scenarios

**Authentication:**
- Valid login returns JWT tokens
- Invalid credentials rejected
- Expired token rejected
- Member cannot access admin endpoints
- Admin cannot access member-only actions

**Loan Applications:**
- Valid application submitted successfully
- Invalid amount rejected
- Missing required fields rejected
- Duplicate pending application rejected
- Member with active loan blocked (if `allow_multiple_active` is False)
- Approval creates Loan + RepaymentSchedule
- Rejection records reason and notifies member

**Eligibility Scoring:**
- High-income member scores high on income factor
- Low-income member scores low on income factor
- Existing obligations reduce score
- Good repayment history boosts score
- Poor repayment history lowers score
- First-time borrower gets neutral 50/100 repayment score
- Total score and recommendation are correct

**Repayments:**
- Full payment updates installment to PAID
- Partial payment creates PARTIALLY_PAID status
- Multiple partial payments sum correctly
- Overpayment applies to next installment
- Loan marked COMPLETED when fully repaid

**Defaulters:**
- 0 days overdue → CURRENT
- 1 day overdue → AT_RISK
- 30 days overdue → AT_RISK
- 31 days overdue → DEFAULTER
- 60 days overdue → DEFAULTER
- 61 days overdue → SEVERE_DEFAULTER

**Audit Trail:**
- Loan approval logged
- Loan rejection logged
- Repayment recorded logged
- Member created/updated logged
- Eligibility rule change logged

### 8.3 Test Configuration (`pytest.ini`)

```ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings
python_files = tests.py test_*.py
addopts = --cov=. --cov-report=term-missing -v
```

---

## Seed Data (`seed/management/commands/load_seed_data.py`)

The `loadseeddata` management command creates:

| Entity | Count |
|---|---|
| Admin user | 1 (admin@unzalaru.com / password123) |
| Member users | 20-50 |
| Loan types | 3-4 (Emergency, Development, Education, Housing) |
| Loan applications | 15-25 (mix of statuses) |
| Approved loans | 10-15 (mix of active/completed) |
| Repayment schedules | Multiple per loan |
| Repayments | Mix of paid/partial/overdue |
| Eligibility scores | Per application |
| Defaulter statuses | Mix of classifications |
| Notifications | Sample notifications |
| Audit logs | Sample audit entries |

Run with:
```bash
python manage.py loadseeddata
```

---

## Admin Configuration Endpoints

All configuration endpoints are admin-only, nested under `/api/admin/config/`.

| Method | URL | Description |
|---|---|---|
| GET | `/api/admin/config/loan-types/` | List loan types |
| POST | `/api/admin/config/loan-types/` | Create loan type |
| PUT | `/api/admin/config/loan-types/{id}/` | Update loan type |
| DELETE | `/api/admin/config/loan-types/{id}/` | Delete/deactivate loan type |
| GET | `/api/admin/config/eligibility-rules/` | List eligibility rules |
| PUT | `/api/admin/config/eligibility-rules/{id}/` | Update eligibility rule |
| GET | `/api/admin/config/system/` | View system settings |
| PUT | `/api/admin/config/system/` | Update system settings |

---

## Notification System

### Notification Model (`notifications/models.py`)

```python
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=[
        ('LOAN_SUBMITTED', 'Loan Submitted'),
        ('LOAN_APPROVED', 'Loan Approved'),
        ('LOAN_REJECTED', 'Loan Rejected'),
        ('REPAYMENT_DUE', 'Repayment Due'),
        ('REPAYMENT_OVERDUE', 'Repayment Overdue'),
        ('STATUS_CHANGE', 'Status Change'),
    ])
    is_read = models.BooleanField(default=False)
    related_loan = models.ForeignKey('loans.Loan', null=True, on_delete=models.SET_NULL)
    related_application = models.ForeignKey('loans.LoanApplication', null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
```

### Notification Service

```python
class NotificationService:
    @staticmethod
    def create(user, title, message, notification_type, **kwargs):
        return Notification.objects.create(
            user=user, title=title, message=message,
            notification_type=notification_type, **kwargs
        )

    @staticmethod
    def notify_loan_submitted(application):
        ...

    @staticmethod
    def notify_loan_approved(loan):
        ...

    @staticmethod
    def notify_loan_rejected(application, reason):
        ...

    @staticmethod
    def notify_repayment_due(schedule):
        ...

    @staticmethod
    def notify_repayment_overdue(schedule):
        ...

    @staticmethod
    def notify_status_change(user, title, message):
        ...
```

### Notification Endpoints

| Method | URL | Access | Description |
|---|---|---|---|
| GET | `/api/notifications/` | Authenticated | List user's notifications |
| PUT | `/api/notifications/{id}/read/` | Authenticated | Mark as read |
| POST | `/api/notifications/mark-all-read/` | Authenticated | Mark all as read |
| GET | `/api/notifications/unread-count/` | Authenticated | Count unread |

---

## Audit Trail

### AuditLog Model (`audit/models.py`)

```python
class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50)  # e.g., "APPROVED_LOAN"
    entity_type = models.CharField(max_length=50)  # e.g., "LoanApplication"
    entity_id = models.CharField(max_length=50)
    description = models.TextField()
    previous_value = models.JSONField(null=True)
    new_value = models.JSONField(null=True)
    ip_address = models.GenericIPAddressField(null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
```

### Auto-Logging Mechanism

Use DRF signals to automatically log key actions:

```python
# audit/signals.py
from rest_framework.signals import pre_save, post_save

# Log when loan application status changes
# Log when loan is created
# Log when repayment is recorded
# Log when member is created/updated
# Log when eligibility rule is changed
```

### Audit Endpoints

| Method | URL | Access | Description |
|---|---|---|---|
| GET | `/api/audit/` | Admin | List audit logs |
| GET | `/api/audit/?action=APPROVED_LOAN` | Admin | Filter by action |
| GET | `/api/audit/?entity_type=Loan` | Admin | Filter by entity |

---

## Complete API URL Map

```python
# config/urls.py
urlpatterns = [
    # Authentication
    path('api/auth/', include('users.urls')),

    # Members
    path('api/members/', include('members.urls')),

    # Loans
    path('api/loan-applications/', include('loans.urls', namespace='applications')),
    path('api/loans/', include('loans.urls', namespace='loans')),

    # Eligibility
    path('api/eligibility/', include('eligibility.urls')),

    # Repayments
    path('api/repayments/', include('repayments.urls')),

    # Defaulters
    path('api/defaulters/', include('defaulters.urls')),

    # Reports
    path('api/reports/', include('reports.urls')),

    # Dashboard
    path('api/dashboard/', include('reports.urls_dashboard')),

    # Notifications
    path('api/notifications/', include('notifications.urls')),

    # Audit
    path('api/audit/', include('audit.urls')),

    # Admin Config
    path('api/admin/config/', include('config_app.urls')),

    # API Docs
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
]
```

---

## Business Rules Summary

| Rule | Implementation |
|---|---|
| No duplicate pending applications | Checked in `LoanApplicationService.create()` |
| Active loan blocks new application | Checked if `LoanType.allow_multiple_active` is False |
| Eligibility calculated before review | Calculated on application submission |
| Admin makes final decision | Eligibility score is advisory only |
| First-time borrowers get neutral score | `repayment_history_score()` returns 50 if no loans |
| Days overdue auto-calculated | `DefaulterDetectionService.calculate_days_overdue()` |
| Repayment history affects future eligibility | `_repayment_history_score()` reads from loan history |

---

## Implementation Order

1. **Phase 1**: Project setup, User model, JWT auth, permissions, base config
2. **Phase 2**: Member model, CRUD endpoints, filters
3. **Phase 3**: LoanType, LoanApplication, Loan models, calculation service, workflow
4. **Phase 4**: EligibilityRule, EligibilityScore models, scoring service
5. **Phase 5**: RepaymentSchedule, Repayment models, payment recording service
6. **Phase 6**: DefaulterStatus model, detection service, management command
7. **Phase 7**: Dashboard endpoints, report endpoints, CSV/PDF export
8. **Phase 8**: Tests, seed data, documentation, refinements

---

## Deliverables

- [ ] Complete Django project with all apps
- [ ] PostgreSQL database with migrations
- [ ] JWT authentication system
- [ ] Member management CRUD
- [ ] Loan application workflow
- [ ] Eligibility scoring engine
- [ ] Loan calculation engine (flat + reducing balance)
- [ ] Repayment schedule generation
- [ ] Repayment recording and tracking
- [ ] Defaulter detection and classification
- [ ] Admin dashboard API
- [ ] Member dashboard API
- [ ] Report generation with CSV/PDF export
- [ ] In-system notifications
- [ ] Audit trail logging
- [ ] Admin configuration endpoints
- [ ] Swagger/OpenAPI documentation
- [ ] Seed data management command
- [ ] Comprehensive test suite
- [ ] `.env.example` and README
