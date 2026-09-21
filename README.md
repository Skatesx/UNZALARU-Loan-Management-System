# UNZALARU-Loan-Management-System

Loan Management System for UNZA Employees.

Django + DRF backend (`backend/`) and React + TypeScript + Vite frontend (`frontend/`).

## Quick start

### Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -e .          # or: pip install django djangorestframework djangorestframework-simplejwt drf-spectacular django-filter django-cors-headers psycopg2-binary
.venv/bin/python manage.py migrate
.venv/bin/python manage.py load_seed_data   # demo data + default config
.venv/bin/python manage.py runserver
```

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
cd backend && .venv/bin/python -m pytest tests/ -q   # 67 tests
cd frontend && npm run build                          # typecheck + build
```

## Core flows

### Member signup and approval

1. Visitor registers at `/signup` (name, email, NRC, department, declared income, password).
2. Account is created immediately and **can sign in**, but the membership is **PENDING**:
   - A banner on every member page shows "membership pending approval".
   - Loan applications are blocked (API rejects with a clear message; the UI disables the form).
   - Profile, notifications, and loan/repayment history for existing loans remain visible.
3. Admin approves or rejects from **Members** (list filter `Pending` → inline Approve) or the member detail page; the member is notified either way.
4. Admin verifies income on the member detail page (sets verified income + verifier); the loan approval criteria consume the verified income.

### Loan approval criteria (configurable)

Criteria are evaluated when an admin approves an application; results are exposed on
`GET /api/loan-applications/{id}/criteria/` and rendered as a pass/fail checklist on the
application detail page. Thresholds are stored in the `SystemConfig` table under key
`loan_approval_criteria` and editable in **Admin → System Settings**:

| Criterion | Default |
|---|---|
| Minimum eligibility score (0–100) | 60 |
| Max installment-to-income ratio | 0.5 |
| Max simultaneous active loans | 1 |
| Require income verification | yes |
| Reject if any overdue installment | yes |
| Reject if classified defaulter | yes |
| Require active membership | yes |
| Minimum membership age (days) | 0 (disabled) |

The eligibility score is computed automatically (on the fly if not yet assessed).
An admin may **override** a failed checklist by supplying a reason at approval time
(required by the UI); the reason is stored on the application and a dedicated
`OVERRIDDEN_APPROVAL_CRITERIA` audit entry is written.

### Repayment modes

Every repayment records a payment mode: `CASH`, `BANK_TRANSFER`, `MOBILE_MONEY`,
`CHEQUE`, `SALARY_DEDUCTION`, `OTHER`. Selectable when recording a payment
(loan detail page or repayments page) and shown in repayment history.

### Membership tracking

Member accounts track `membership_status` (`PENDING` → `ACTIVE`, or `REJECTED`),
income verification state, and sign-in/loan activity. The `date_joined` user field
has been removed from all APIs and UI in line with the updated requirements.

## API overview

- `POST /api/members/signup/` — public self-registration
- `GET/PATCH /api/members/me/`, `GET /api/members/me/profile/` — self-service
- `POST /api/members/{id}/approve/`, `.../reject/`, `.../verify-income/` — admin actions
- `POST /api/loan-applications/`, `POST /api/loan-applications/{id}/approve/` (body may include `override_reason`), `GET /api/loan-applications/{id}/criteria/`
- `POST /api/repayments/` with `payment_mode`
- `GET/PUT /api/admin/config/system/` — system configuration (criteria live here)

Full schema: `http://localhost:8000/api/docs/` (Swagger) or `/api/redoc/`.
