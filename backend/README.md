# UNZALARU Loan Management System — Backend

Backend API for the University of Zambia Lecturers and Researchers Union (UNZALARU) Loan Management System.

## Technology Stack

- **Framework**: Django 5.x + Django REST Framework 3.x
- **Database**: PostgreSQL 15+
- **Authentication**: JWT (djangorestframework-simplejwt)
- **API Docs**: drf-spectacular (OpenAPI 3.0 + Swagger UI)
- **Package Manager**: uv
- **Python**: 3.11+

## Project Structure

```
backend/
├── config/          # Django project settings
├── users/           # Custom User model, auth, JWT
├── members/         # Member profile management
├── loans/           # Loan types, applications, loans
├── eligibility/     # Rule-based eligibility scoring
├── repayments/      # Repayment schedules & tracking
├── defaulters/      # Defaulter detection & classification
├── reports/         # Reports, dashboards, CSV/PDF export
├── notifications/   # In-system notifications
├── audit/           # Audit trail logging
├── config_app/      # Admin configuration management
├── seed/            # Seed data management command
└── tests/           # Test suite
```

## Requirements

- Python 3.11+
- PostgreSQL 15+
- uv package manager

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   uv sync
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials.

4. **Create the database:**
   ```bash
   createdb unzalaru_db
   ```

5. **Run migrations:**
   ```bash
   uv run python manage.py migrate
   ```

6. **Create superuser:**
   ```bash
   uv run python manage.py createsuperuser
   ```

7. **Load seed data:**
   ```bash
   uv run python manage.py loadseeddata
   ```

8. **Run the server:**
   ```bash
   uv run python manage.py runserver
   ```

## API Documentation

Once running, access:
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **Schema**: http://localhost:8000/api/schema/

## Seed Data

Run `uv run python manage.py loadseeddata` to create:
- 1 admin user (admin@unzalaru.com / password123)
- 30 member users (first.last@unzalaru.com / password123)
- 4 loan types (Emergency, Development, Education, Housing)
- Loan applications, loans, repayment schedules, and more

## Running Tests

```bash
uv run pytest
```

## Key Features

- **JWT Authentication** with role-based access control (Admin/Member)
- **Loan Application Workflow** with validation and business rules
- **Eligibility Scoring** with configurable rules and factors
- **Loan Calculation Engine** supporting flat rate and reducing balance interest
- **Repayment Schedule Generation** and payment tracking
- **Defaulter Detection** with automatic classification
- **Admin Dashboard** with summary cards and chart data
- **Report Generation** with CSV and PDF export
- **In-system Notifications** for loan status changes
- **Audit Trail** for administrative actions
- **Admin Configuration** for loan types and eligibility rules

## Business Rules

- Members cannot have duplicate pending applications for the same loan type
- Active loans block new applications (configurable per loan type)
- Eligibility score is advisory — admin makes final decision
- First-time borrowers receive a neutral repayment score (50/100)
- Defaulter classification: Current (0 days) → At Risk (1-30) → Defaulter (31-60) → Severe Defaulter (61+)
- Repayment history affects future eligibility scoring
