# UNZALARU LOAN MANAGEMENT SYSTEM

## AI Coding Agent — Complete Project Requirements & Build Specification

## 1. Project Overview

Build a complete web-based **Loan Management System for the University of Zambia Lecturers and Researchers Union (UNZALARU)**.

UNZALARU currently manages loan applications, approvals, and repayments manually. This causes delays, inaccurate record keeping, difficulty tracking repayments, inconsistent loan decisions, and difficulty identifying members who are defaulting.

The proposed system must digitize and automate these processes while providing:

* Member management
* Loan application
* Loan approval/rejection workflow
* Loan eligibility scoring
* Automated interest and repayment calculations
* Repayment tracking
* Automated defaulter detection
* Administrative dashboards
* Reports
* Role-based authentication and access control

The system is intended to be a **web application** using a client-server architecture.

The original project proposal specifies:

* Frontend: React
* Backend: Django REST Framework
* Database: PostgreSQL or MySQL
* Programming languages: JavaScript and Python
* Development tools: VS Code, GitHub and Postman
* Development methodology: Agile

These technologies should be used unless there is a strong technical reason to change them.

---

# 2. Main Project Aim

Design and implement a web-based Loan Management System with integrated **loan eligibility scoring** and **defaulter detection** for UNZALARU.

---

# 3. Project Objectives

The system must support the following objectives:

1. Digitize the existing manual loan management process.
2. Allow members to apply for loans electronically.
3. Allow administrators to review and process applications.
4. Provide a rule-based loan eligibility scoring mechanism.
5. Automatically calculate loan interest and repayment schedules.
6. Track repayments and outstanding balances.
7. Automatically identify overdue repayments.
8. Classify borrowers according to their overdue period.
9. Use previous repayment behaviour when calculating future eligibility.
10. Provide dashboards and reports for administrators.
11. Maintain secure and confidential member financial information.
12. Provide a usable and responsive web interface.

These objectives are based on the project's stated objectives.

---

# 4. Scope

## 4.1 Features IN Scope

The application must include:

* User authentication
* Member accounts
* Administrator accounts
* Role-based access control
* Member profile management
* Loan application
* Loan application review
* Loan approval/rejection
* Loan eligibility scoring
* Interest calculation
* Repayment schedule generation
* Repayment recording
* Repayment tracking
* Outstanding balance calculation
* Overdue payment detection
* Defaulter classification
* Loan history
* Member borrowing history
* Administrative dashboard
* Reports
* Notifications/status messages
* Audit/history records

The original proposal specifically identifies authentication, loan workflow, eligibility scoring, interest/repayment calculations, repayment tracking, defaulter detection, reporting and dashboards as in-scope features.

---

# 5. Features OUT of Scope

Do NOT implement:

* Banking integrations
* Mobile money integrations
* Real-time financial transactions
* A native Android/iOS application
* Advanced machine-learning models

The eligibility system should be **rule-based**, not an advanced ML model.

---

# 6. User Roles

Implement at least two roles.

## 6.1 Member

Members should be able to:

* Register/login
* View their profile
* View their membership information
* Apply for a loan
* View loan application status
* View eligibility score
* View approved loans
* View repayment schedule
* View repayment history
* View outstanding balance
* View overdue payments
* View their borrower/defaulter status
* View previous loans

Members must NOT be able to:

* Approve their own loans
* Modify eligibility scores
* Modify repayment records
* Change defaulter classifications
* Access other members' financial information
* Access administrative reports

---

## 6.2 Administrator

Administrators should be able to:

* Login
* View system dashboard
* Manage members
* View member profiles
* View all loan applications
* Review applications
* View eligibility scores
* Approve/reject applications
* Configure loan rules
* View active loans
* Record repayments
* Monitor overdue repayments
* View defaulters
* View borrower histories
* Generate reports
* Search/filter members
* Search/filter loans
* View system statistics
* Manage users
* View audit logs

Administrators are responsible for the final loan decision.

The eligibility score is only a recommendation and must NOT automatically approve a loan.

---

# 7. Authentication & Authorization

Implement secure authentication.

Required functionality:

* Login
* Logout
* Password hashing
* Role-based authorization
* Protected API endpoints
* Session/token authentication
* Password reset/change functionality
* Account activation/deactivation

Every API endpoint must verify that the authenticated user has permission to perform the requested operation.

Members must only access their own data.

Administrators can access administrative functionality.

The proposal specifically requires secure authentication, access control, privacy, confidentiality and role-based access.

---

# 8. Member Management

Create a member profile containing information such as:

* Member ID
* Full name
* NRC/identification number
* Email
* Phone number
* Address
* Department
* Employment information
* Employment status
* Monthly income
* Date joined
* Membership status
* Account status

The system should allow administrators to:

* Create members
* Edit members
* Deactivate members
* Search members
* View member loan history
* View repayment history
* View eligibility history
* View defaulter history

---

# 9. Loan Application Module

Members must be able to submit loan applications.

A loan application should contain:

* Application ID
* Member
* Loan type
* Requested amount
* Loan duration
* Purpose
* Application date
* Current employment information
* Income information
* Existing loan obligations
* Eligibility score
* Application status

Possible application statuses:

```text
PENDING
UNDER_REVIEW
APPROVED
REJECTED
CANCELLED
```

When an application is submitted:

1. Validate the member.
2. Validate the requested amount.
3. Check existing loans.
4. Calculate eligibility score.
5. Calculate affordability information.
6. Generate an eligibility recommendation.
7. Send the application to the administrator for final decision.

---

# 10. Loan Eligibility Scoring

Implement a **rule-based scoring system**.

The proposal identifies these factors:

* Income level
* Existing loan obligations
* Employment stability
* Repayment history

Each factor receives a configurable weight and contributes to the final score.

## Suggested scoring architecture

Create a configurable scoring system rather than hard-coding values throughout the application.

Example:

```text
Income Score
Employment Stability Score
Existing Obligation Score
Repayment History Score
-------------------------
Total Eligibility Score
```

Store scoring rules in the database so administrators can modify them.

For example:

```text
Income:
0–5,000       → low score
5,001–10,000   → medium score
10,001+        → high score
```

These values are examples only. The system should make the actual thresholds configurable.

---

# 11. First-Time Borrowers

Members without previous loan history must NOT automatically receive a poor repayment score.

They should be treated as first-time borrowers and receive a **neutral repayment score**.

This requirement is explicitly stated in the proposal.

---

# 12. Eligibility Recommendation

The system should produce an eligibility result such as:

```text
Score: 82/100

Recommendation: ELIGIBLE

Reasons:
✓ Stable employment
✓ Good income
✓ No major existing obligations
✓ Good repayment history
```

Possible recommendations:

```text
ELIGIBLE
REVIEW
NOT ELIGIBLE
```

The recommendation is advisory.

The administrator must make the final approval decision.

---

# 13. Loan Approval Workflow

Implement the following workflow:

```text
Member
   ↓
Submit Application
   ↓
System Validation
   ↓
Eligibility Score
   ↓
Administrator Review
   ↓
Approve / Reject
   ↓
If Approved
   ↓
Create Loan
   ↓
Generate Repayment Schedule
   ↓
Track Repayments
```

If rejected:

```text
Application
   ↓
Rejected
   ↓
Reason recorded
   ↓
Member notified
```

Administrators should provide a reason when rejecting an application.

---

# 14. Loan Calculation

When a loan is approved, the system must calculate:

* Principal
* Interest
* Total repayment
* Repayment frequency
* Number of installments
* Installment amount
* Due dates
* Outstanding balance

The proposal requires automated interest and repayment calculations.

The calculation method should be implemented in a reusable backend service.

Do not duplicate calculation logic across API endpoints.

---

# 15. Repayment Schedule

For every approved loan, automatically generate a repayment schedule.

Each installment should contain:

* Installment ID
* Loan ID
* Due date
* Expected amount
* Amount paid
* Remaining amount
* Payment status
* Days overdue

Possible statuses:

```text
PENDING
PARTIALLY_PAID
PAID
OVERDUE
```

Example:

```text
Loan Amount:       K20,000
Interest:          K2,000
Total Repayment:   K22,000
Duration:          10 months

Installment:
K2,200 per month
```

The actual interest methodology should be configurable.

---

# 16. Repayment Tracking

Administrators must be able to record repayments.

When a repayment is recorded:

1. Validate the loan.
2. Validate the payment amount.
3. Apply the payment to outstanding installments.
4. Update installment status.
5. Update loan balance.
6. Recalculate overdue status.
7. Update the member's repayment history.
8. Recalculate relevant borrower statistics.

Members should be able to view their repayment history but should not be able to modify it.

---

# 17. Defaulter Detection

Implement an automated defaulter detection mechanism.

The system must monitor repayment due dates and calculate how many days a payment is overdue.

Classification must follow the project proposal:

```text
0 days overdue
→ Current

1–30 days overdue
→ AT RISK

31–60 days overdue
→ DEFAULTER

More than 60 days overdue
→ SEVERE DEFAULTER
```

These classifications are explicitly defined in the proposal.

The system should automatically update borrower status based on repayment behaviour.

---

# 18. Defaulter Dashboard

Administrators should have a dedicated defaulters page.

Display:

* Member name
* Member ID
* Loan ID
* Loan amount
* Outstanding amount
* Missed installment
* Due date
* Days overdue
* Defaulter classification
* Contact information
* Previous default history

Allow filtering by:

```text
AT RISK
DEFAULTER
SEVERE DEFAULTER
```

---

# 19. Repayment Behaviour & Future Eligibility

The system must connect repayment history with future loan eligibility.

Members who consistently repay loans should receive better repayment-history scores.

Members who default should receive lower repayment-history scores for future applications.

This relationship is explicitly required by the proposal.

Example:

```text
Good repayment history
        ↓
Higher repayment score
        ↓
Higher eligibility score

Default history
        ↓
Lower repayment score
        ↓
Lower eligibility score
```

---

# 20. Administrator Dashboard

Create a professional dashboard containing:

### Summary cards

* Total Members
* Pending Applications
* Approved Loans
* Active Loans
* Total Amount Loaned
* Total Amount Repaid
* Outstanding Balance
* At-Risk Borrowers
* Defaulters
* Severe Defaulters

### Charts

Include useful visualizations such as:

* Loans issued over time
* Repayments over time
* Loan status distribution
* Application approval/rejection distribution
* Defaulters by classification
* Outstanding loan amounts
* Member borrowing trends

---

# 21. Member Dashboard

Members should see:

```text
Welcome, [Member Name]

Eligibility Score
Current Loan
Outstanding Balance
Next Payment
Next Payment Date
Borrower Status
Loan Applications
Loan History
Repayment History
```

The member dashboard should be significantly simpler than the administrator dashboard.

---

# 22. Reports

Create administrative reports for:

### Loan Report

Show:

* Loan ID
* Member
* Amount
* Interest
* Total repayment
* Duration
* Status
* Date approved

### Repayment Report

Show:

* Member
* Loan
* Expected payment
* Actual payment
* Payment date
* Outstanding balance
* Status

### Defaulter Report

Show:

* Member
* Loan
* Amount overdue
* Days overdue
* Classification

### Eligibility Report

Show:

* Member
* Application
* Eligibility score
* Score breakdown
* Recommendation
* Final decision

Reports should support filtering by:

* Date
* Member
* Loan status
* Defaulter status
* Application status

Where practical, provide export functionality such as CSV/PDF.

---

# 23. Loan History

Every member must have a complete loan history.

Display:

```text
Loan #1
Amount
Date
Duration
Status
Total repayment
Amount repaid
Outstanding balance
Repayment performance
```

The system must preserve historical information even after a loan has been completed.

---

# 24. Audit Trail

Create an audit log for important administrative actions.

Record:

* User
* Action
* Entity affected
* Entity ID
* Timestamp
* Previous value where applicable
* New value where applicable

Examples:

```text
Admin approved loan #102
Admin rejected loan #108
Admin recorded repayment for loan #101
Admin changed eligibility rule
Admin deactivated member #203
```

This is important because the project aims to improve transparency and accountability.

---

# 25. Database Design

Create a properly normalized relational database.

Suggested core entities:

```text
User
Member
Role
LoanApplication
Loan
LoanType
Repayment
RepaymentSchedule
EligibilityScore
EligibilityRule
DefaulterStatus
Notification
AuditLog
```

Relationships should be properly defined using foreign keys.

Avoid storing calculated values that can easily become inconsistent unless there is a clear reason to cache them.

---

# 26. Suggested Backend Structure

Use Django REST Framework.

Recommended structure:

```text
backend/
├── manage.py
├── config/
├── users/
├── members/
├── loans/
├── repayments/
├── eligibility/
├── defaulters/
├── reports/
├── notifications/
└── audit/
```

Use:

* Django
* Django REST Framework
* PostgreSQL or MySQL
* Django ORM
* JWT/token authentication where appropriate

Separate business logic from views/controllers.

For example:

```text
views
   ↓
services
   ↓
models
```

Loan calculations, eligibility calculations and defaulter calculations should be implemented as dedicated services.

---

# 27. Suggested Frontend Structure

Use React.

Suggested structure:

```text
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   ├── utils/
│   └── routes/
```

Create separate layouts for:

```text
Member Portal
Admin Portal
```

Use reusable components.

---

# 28. API Requirements

Build REST APIs for all major operations.

Example endpoints:

```text
POST   /api/auth/login/
POST   /api/auth/logout/

GET    /api/members/
GET    /api/members/{id}/
PUT    /api/members/{id}/

POST   /api/loan-applications/
GET    /api/loan-applications/
GET    /api/loan-applications/{id}/
PUT    /api/loan-applications/{id}/approve/
PUT    /api/loan-applications/{id}/reject/

GET    /api/loans/
GET    /api/loans/{id}/

GET    /api/loans/{id}/repayments/
POST   /api/repayments/

GET    /api/eligibility/{application_id}/
GET    /api/defaulters/
GET    /api/reports/
```

Use proper HTTP status codes and validation errors.

Document the API using Swagger/OpenAPI if possible.

---

# 29. Validation

The backend must never trust frontend validation.

Validate:

* Required fields
* Loan amount
* Loan duration
* Member status
* Existing active loans
* Duplicate applications
* Repayment amounts
* Payment dates
* User permissions

Return clear API error messages.

---

# 30. Security Requirements

Implement:

* Password hashing
* Authentication
* Authorization
* Role-based access control
* Input validation
* CSRF protection where applicable
* Secure API configuration
* Environment variables for secrets
* Database credentials outside source code
* CORS configuration
* Protection against unauthorized data access

Never expose passwords or sensitive financial information in API responses unnecessarily.

---

# 31. Privacy Requirements

The system handles personal and financial information.

Therefore:

* Members can only access their own financial information.
* Administrators have controlled access.
* Sensitive data should not be exposed publicly.
* Passwords must never be stored as plain text.
* API responses should expose only required information.
* Audit important access and administrative operations.

These requirements align with the proposal's privacy, security, consent, fairness and confidentiality considerations.

---

# 32. UI/UX Requirements

Build a modern, professional university/financial-management interface.

Requirements:

* Responsive design
* Desktop support
* Tablet support
* Clean navigation
* Sidebar for dashboards
* Tables with pagination
* Search
* Filtering
* Confirmation dialogs
* Form validation
* Loading states
* Empty states
* Error states
* Success messages
* Clear status badges

Use clear colors/icons to distinguish:

```text
Pending
Approved
Rejected
Paid
Overdue
At Risk
Defaulter
Severe Defaulter
```

The application should look like a real production financial management system rather than a basic student CRUD project.

---

# 33. Notifications

Implement basic in-system notifications.

Examples:

```text
Your loan application has been submitted.

Your loan application has been approved.

Your loan application has been rejected.

Your repayment is due in 3 days.

Your repayment is overdue.

Your account has been classified as At Risk.
```

Email notifications can be added if practical, but they are not required for the core system.

---

# 34. Business Rules

Implement the following important rules.

### Rule 1 — Active loan

A member should not be allowed to submit another loan if the configured business rules prohibit multiple active loans.

Make this configurable rather than hard-coding the restriction.

### Rule 2 — Eligibility

Eligibility must be calculated before administrator review.

### Rule 3 — Final decision

The eligibility score does not automatically approve a loan.

### Rule 4 — First-time borrower

No repayment history should result in a neutral repayment score.

### Rule 5 — Overdue calculation

The system automatically calculates days overdue from installment due dates.

### Rule 6 — Defaulter classification

```text
1–30 → At Risk
31–60 → Defaulter
>60 → Severe Defaulter
```

### Rule 7 — Future eligibility

Previous repayment behaviour affects future eligibility.

---

# 35. Configurable Settings

Avoid hard-coding important business rules.

Create an administrator configuration area for:

* Interest rates
* Loan types
* Maximum loan amounts
* Minimum loan amounts
* Loan durations
* Eligibility weights
* Eligibility thresholds
* Income brackets
* Employment stability scoring
* Repayment scoring
* Defaulter thresholds

This will make the system easier to maintain and demonstrate during the final-year project presentation.

---

# 36. Testing Requirements

Create automated and manual tests.

Test:

### Authentication

* Valid login
* Invalid login
* Unauthorized access
* Member accessing admin endpoint

### Loan applications

* Valid application
* Invalid amount
* Missing fields
* Duplicate application
* Application approval
* Application rejection

### Eligibility

* High-income member
* Low-income member
* Existing obligations
* Good repayment history
* Poor repayment history
* First-time borrower

### Repayments

* Full payment
* Partial payment
* Multiple payments
* Overpayment
* Late payment
* Completed loan

### Defaulters

Test:

```text
0 days
1 day
30 days
31 days
60 days
61 days
```

Verify the correct classification.

---

# 37. Seed/Test Data

Because the proposal identifies lack of real data as a project risk, use simulated/test data during development.

Create seed data including:

* 1 administrator
* 20–50 members
* Several loan applications
* Approved loans
* Rejected loans
* Active loans
* Completed loans
* Paid installments
* Overdue installments
* At-risk members
* Defaulters
* Severe defaulters

Make the dashboard immediately demonstrate realistic data after installation.

---

# 38. API Documentation

Document all APIs.

For each endpoint provide:

* Method
* URL
* Authentication requirement
* Request body
* Parameters
* Response
* Error responses

Prefer Swagger/OpenAPI.

---

# 39. README

Create a comprehensive README containing:

```text
Project Overview
Features
Technology Stack
System Architecture
Requirements
Installation
Environment Variables
Database Setup
Running Backend
Running Frontend
Creating Admin User
Loading Seed Data
API Documentation
Testing
Deployment
```

---

# 40. Environment Configuration

Use environment variables.

Example:

```text
DATABASE_URL=
SECRET_KEY=
DEBUG=
ALLOWED_HOSTS=
CORS_ALLOWED_ORIGINS=
```

Never commit secrets.

Provide:

```text
.env.example
```

---

# 41. Deliverables

The coding agent must produce:

1. Complete React frontend.
2. Complete Django REST Framework backend.
3. Database models and migrations.
4. Authentication system.
5. Member management.
6. Loan application workflow.
7. Eligibility scoring system.
8. Loan calculation engine.
9. Repayment schedule.
10. Repayment tracking.
11. Defaulter detection.
12. Admin dashboard.
13. Member dashboard.
14. Reports.
15. Audit logging.
16. API documentation.
17. Seed/test data.
18. Automated tests.
19. README documentation.
20. `.env.example`.

---

# 42. Important Implementation Principle

Do NOT build this as a collection of disconnected CRUD pages.

The application must behave as one integrated system.

For example:

```text
Member
  ↓
Loan Application
  ↓
Eligibility Scoring
  ↓
Administrator Decision
  ↓
Approved Loan
  ↓
Repayment Schedule
  ↓
Repayments
  ↓
Overdue Detection
  ↓
Defaulter Classification
  ↓
Repayment History
  ↓
Future Eligibility Score
```

All these modules must be connected through the database and business logic.

---

# 43. Development Approach

Follow an Agile/iterative development approach.

Implement in this order:

## Phase 1 — Foundation

* Project setup
* Database
* Authentication
* Roles
* Base layouts
* API structure

## Phase 2 — Members

* Member profiles
* Member management
* Member dashboard

## Phase 3 — Loans

* Loan types
* Loan applications
* Application workflow
* Loan approval/rejection

## Phase 4 — Eligibility

* Eligibility rules
* Scoring engine
* Score breakdown
* Recommendations

## Phase 5 — Repayments

* Loan calculations
* Repayment schedules
* Payment recording
* Balance tracking

## Phase 6 — Defaulters

* Overdue detection
* Classification
* Defaulter dashboard
* Repayment behaviour integration

## Phase 7 — Reporting

* Dashboards
* Charts
* Reports
* Filtering
* Export

## Phase 8 — Testing & Refinement

* Unit tests
* API tests
* Frontend tests
* Security testing
* UI/UX improvements
* Bug fixing

This follows the proposal's stated methodology of requirements analysis, UML/system design, frontend/backend development, database/business-logic integration, testing and evaluation.

---

# 44. Final Agent Instructions

Before considering the project complete:

* Verify every requirement in this specification.
* Do not leave placeholder pages.
* Do not use fake frontend-only data for core functionality.
* All important business logic must run on the backend.
* Ensure database relationships are correct.
* Ensure role permissions work.
* Ensure eligibility calculations are reproducible and explainable.
* Ensure defaulter classification is automatically calculated.
* Ensure repayment data affects future eligibility.
* Ensure administrators make final loan decisions.
* Ensure members cannot manipulate financial records.
* Test the complete loan lifecycle from application to repayment completion.
* Provide clear setup instructions.
* Fix all major runtime errors before completion.

The final result should be a functional, integrated and demonstrable **UNZALARU Loan Management System**, not merely a prototype of individual screens.
