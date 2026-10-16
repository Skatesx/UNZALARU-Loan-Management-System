# UNZALARU-Loan-Management-System

Loan Management System for UNZA Employees.

Django + DRF backend (`backend/`) and React + TypeScript + Vite frontend (`frontend/`).

## Quick start

### Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -e .          # or: pip install django djangorestframework djangorestframework-simplejwt drf-spectacular django-filter django-cors-headers "psycopg[binary]" python-decouple reportlab faker pytest pytest-django
cp .env.example .env                # then edit DATABASE_URL / SECRET_KEY
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

1. Visitor registers at `/signup` (name, email, **MAN number**, NRC, department, password).
   The department is chosen from the UNZA list; the member's **school** is worked out from it
   (edit the list in `backend/members/schools.py`).
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
current, i.e. active, members), **school** and **department**; CSV and PDF
exports use the same filters. All report pages now have tabs to move between
the Loans, Repayments, Defaulters, Eligibility and Membership reports.

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
- `GET /api/members/schools/` — UNZA schools and their departments
- `GET /api/reports/membership/?status=&school=&department=`, `.../membership/export/{csv|pdf}/`

Full schema: `http://localhost:8000/api/docs/` (Swagger) or `/api/redoc/`.
