# UNZALARU-Loan-Management-System

Loan Management System for UNZA Employees.

Django + DRF backend (`backend/`) and React + TypeScript + Vite frontend (`frontend/`).

## Quick start

### Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -e .          # or: pip install django djangorestframework djangorestframework-simplejwt drf-spectacular django-filter django-cors-headers "psycopg[binary]" python-decouple reportlab faker pytest pytest-django
cp .env.example .env                # then edit DATABASE_URL and set a long random SECRET_KEY
.venv/bin/python manage.py migrate
.venv/bin/python manage.py load_seed_data   # demo data + default config
.venv/bin/python manage.py runserver
```

On Windows use `.venv\Scripts\pip` / `.venv\Scripts\python` instead of `.venv/bin/...`, and `copy` instead of `cp`.

Postgres: create a database and user, or adjust `backend/.env` (see `.env.example`).

Seed logins (password `password123` for all):

- Admin: `admin@unzalaru.com`
- Members: `first.lastN@unzalaru.com` (e.g. `john.mwansa1@unzalaru.com`)
- Pending members (awaiting approval): `chanda.mwansa@unzalaru.com`, `mutale.chewe@unzalaru.com`, `bupe.chisanga@unzalaru.com`

### Frontend

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

Set `VITE_API_BASE_URL` if the API is not at `http://localhost:8000/api`.

## Tests

```bash
cd backend && .venv/bin/python -m pytest tests/ -q   # 73 tests
cd frontend && npm run build                          # typecheck + build
```

## Core flows

### Member signup and approval

1. Visitor registers at `/signup` (name, email, **MAN number**, NRC, school / faculty, department, password).
   Members type their own school / faculty and department; spacing is tidied and an existing
   spelling is reused when the same name is entered with different capitals, so reports group them together.
   The MAN number (UNZA staff number) must be unique and becomes the member's ID.
2. Account is created immediately and **can sign in**, but the membership is **PENDING**:
   - A banner on every member page shows "membership pending approval".
   - Loan applications are blocked (API rejects with a clear message; the UI disables the form).
   - Profile, notifications, and loan/repayment history for existing loans remain visible.
3. Admin approves or rejects from **Members** (list filter `Pending` → inline Approve) or the member detail page; the member is notified either way.

Income is not collected or verified anywhere in the system.

### The flat loan

UNZALARU members qualify by membership, so there is a single loan product, the
**Flat Loan**: members borrow **K10,000, K15,000 or K20,000** at **10% interest
charged once** (K10,000 → repay K11,000), repaid over **1-12 months** of their
choice. Admins can change the amounts, rate and longest repayment period under
**Configuration → Loan Settings**. The old loan types are kept, inactive, so
existing loans keep their history.

### Loan approval criteria (configurable)

Criteria are evaluated when an admin approves an application; results are exposed on
`GET /api/loan-applications/{id}/criteria/` and rendered as a pass/fail checklist on the
application detail page. Thresholds are stored in the `SystemConfig` table under key
`loan_approval_criteria` and editable in **Admin → System Settings**:

| Criterion | Default |
|---|---|
| Minimum eligibility score (0–100) | 60 |
| Max simultaneous active loans | 1 |
| Reject if any overdue installment | yes |
| Reject if classified defaulter | yes |
| Require active membership | yes |
| Minimum membership age (days) | 0 (disabled) |

The eligibility score is computed automatically (on the fly if not yet assessed).

### First-time applicant priority

The system counts how many times each member has applied for a loan (cancelled
applications don't count) and gives **first-time applicants priority**:

- **Members** list and member pages show *Times applied*.
- **Loan Applications** list shows *Applied Before* (a **First-time** badge for 0)
  and sorts by **Priority (first-time first)** by default (`?ordering=priority`:
  fewest earlier applications first, then oldest).
- The approval checklist includes a non-blocking *Loan application history* line.
- The eligibility score's **Application History** factor (30%) scores 0 earlier
  applications 100, 1 → 70, 2 → 40, 3 or more → 10.
An admin may **override** a failed checklist by supplying a reason at approval time
(required by the UI); the reason is stored on the application and a dedicated
`OVERRIDDEN_APPROVAL_CRITERIA` audit entry is written.

### Membership report

**Reports → Membership** (admins and supervisors) lists members with totals by
membership status, school and department. Filter by membership (defaults to
current, i.e. active, members), **school** and **department** - the dropdowns list
the schools and departments members have entered; CSV and PDF
exports use the same filters. All report pages now have tabs to move between
the Loans, Repayments, Defaulters, Eligibility and Membership reports.

### Payroll deductions (salary-based repayments)

Loans are repaid through salary deductions. **Lending → Payroll Deductions**
(admins and supervisors; only admins confirm):

1. Pick the payroll month. The list shows every member with an active loan:
   MAN number, this month's installment, **arrears** from earlier months and
   the total to deduct. Download it as CSV/PDF and send it to payroll.
2. After payroll runs, **upload payroll's return** - a CSV with a MAN number
   column and an amount deducted column (column names are matched loosely).
   Each line is marked Deducted / Partly deducted / Not deducted, and MAN
   numbers not on the list are flagged. Without a file, tick or edit the
   amounts by hand. **Download return template** gives a pre-filled return to
   edit, e.g. for a demo.
3. Optionally enter the amount received in the bank (checked against the
   total), then **Confirm**. The deducted amounts are recorded as
   `SALARY_DEDUCTION` repayments (oldest installment first), anyone not
   deducted stays in arrears and is classified as overdue, the month is locked
   (it can only be confirmed once) and an audit entry is written.

There is no direct link to the payroll system: UNZALARU exchanges files with
payroll, as a separate loans board would. Manual repayments remain for
exceptions (e.g. early settlement) and default to Salary Deduction.

### Staff accounts and passwords

- **System → Staff Accounts** (admins only): add admins or supervisors (a
  temporary password is generated and shown once), change roles, deactivate or
  reactivate accounts, and reset passwords. An admin can't change their own
  role or deactivate themselves, and there is always at least one active admin.
- **Forgot password** emails a one-time reset link (valid for a limited time)
  that opens `/reset-password`. Without a mail server the email is printed in
  the backend's terminal window; set `EMAIL_BACKEND`, `EMAIL_HOST`, etc. in
  `.env` to send real email, and `FRONTEND_URL` if the frontend isn't at
  `http://localhost:5173`.
- Admins can also **Reset password** for a member (member page) or staff
  member, which shows a temporary password to hand over.
- Everyone can **Change password** from the account menu (top right).

### Privacy notice and consent

Signup shows a short privacy notice (what data is collected, why, who can see
it, what is shared with payroll, how it is protected) with a link to the full
notice. Members must tick the consent box to register; the backend rejects a
signup without consent and records when the member agreed (`data_consent_at`).

### Automatic defaulter detection

Days overdue grow every day, so overdue and defaulter statuses (At Risk 1-30
days, Defaulter 31-60, Severe Defaulter 61+) refresh automatically **once a
day**, the first time the admin dashboard, the Defaulters page or report, a
member dashboard or an approval checklist is opened. Recording repayments and
confirming payroll deductions also refresh them.

On a server, schedule the same check to run every morning, e.g. with Windows
Task Scheduler (daily trigger) running, from the `backend` folder:

```bash
.venv\Scripts\python.exe manage.py update_defaulter_statuses
```

### Repayment modes

Every repayment records a payment mode: `CASH`, `BANK_TRANSFER`, `MOBILE_MONEY`,
`CHEQUE`, `SALARY_DEDUCTION`, `OTHER`. Selectable when recording a payment
(loan detail page or repayments page) and shown in repayment history.

### Membership tracking

Member accounts track `membership_status` (`PENDING` → `ACTIVE`, or `INACTIVE` when a signup is rejected),
their loan application count, and sign-in/loan activity. The `date_joined` user field
has been removed from all APIs and UI in line with the updated requirements.

## API overview

- `POST /api/members/signup/` — public self-registration
- `GET/PATCH /api/members/me/`, `GET /api/members/me/profile/` — self-service
- `POST /api/members/{id}/approve/`, `.../reject/` — admin actions
- `POST /api/loan-applications/`, `POST /api/loan-applications/{id}/approve/` (body may include `override_reason`), `GET /api/loan-applications/{id}/criteria/`
- `POST /api/repayments/` with `payment_mode`
- `GET/PUT /api/admin/config/system/` — system configuration (criteria live here)
- `GET /api/members/schools/` — schools/faculties and departments members have entered (staff only; report filters)
- `GET /api/reports/membership/?status=&school=&department=`, `.../membership/export/{csv|pdf}/`
- `GET /api/payroll/deductions/?month=YYYY-MM`, `.../export/{csv|pdf|template}/?month=`
- `POST /api/payroll/deductions/match/` (multipart `month`, `file`), `POST /api/payroll/deductions/confirm/`
- `GET/POST /api/auth/staff/`, `PATCH /api/auth/staff/{id}/` — staff accounts (admin)
- `POST /api/auth/users/{id}/reset-password/` — admin sets a temporary password
- `POST /api/auth/password-reset/` (email), `POST /api/auth/password-reset/confirm/` (`uid`, `token`, `new_password`)

Full schema: `http://localhost:8000/api/docs/` (Swagger) or `/api/redoc/`.
