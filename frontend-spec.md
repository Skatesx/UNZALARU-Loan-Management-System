# UNZALARU Loan Management System — Frontend Specification

## 1. Overview

This document specifies the complete frontend implementation for the UNZALARU Loan Management System. The frontend is a **React SPA** that consumes the Django REST Framework backend API, providing two distinct role-based interfaces: an **Admin Portal** and a **Member Portal**.

The system handles loan applications, eligibility scoring, repayment tracking, defaulter detection, reporting, and in-system notifications — all integrated as a cohesive financial management platform.

---

## 2. Technology Stack

| Component | Technology | Version |
|---|---|---|
| Framework | React | 18.x |
| Build tool | Vite | 5.x |
| Language | TypeScript (strict mode) | 5.x |
| CSS framework | Tailwind CSS | 3.x |
| Component library | shadcn/ui | latest |
| State management | TanStack Query (React Query) | 5.x |
| Routing | React Router | v6 |
| Forms | React Hook Form | 7.x |
| Validation | Zod | 3.x |
| Tables | TanStack Table | 8.x |
| Charts | Recharts | 2.x |
| HTTP client | Axios | 1.x |
| Package manager | npm | 10.x |

### Additional Dependencies

```
@tanstack/react-query       # Server state management
@tanstack/react-table        # Headless table component
react-router-dom             # Client-side routing
react-hook-form              # Form state management
@hookform/resolvers          # Zod resolver for RHF
zod                          # Schema validation
axios                        # HTTP client
recharts                     # Charts and visualizations
lucide-react                 # Icon library (used by shadcn/ui)
class-variance-authority     # Component variants (shadcn/ui)
clsx                         # Conditional class utility
tailwind-merge               # Tailwind class merging
date-fns                     # Date formatting and manipulation
sonner                       # Toast notifications (used by shadcn/ui)
cmdk                         # Command palette (shadcn/ui)
```

### Project Structure

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── components.json            # shadcn/ui config
├── .env.example
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx               # App entry point
│   ├── App.tsx                # Root component with router
│   ├── index.css              # Global styles + Tailwind directives
│   ├── vite-env.d.ts          # Vite type declarations
│   │
│   ├── api/                   # API layer
│   │   ├── client.ts          # Axios instance + interceptors
│   │   ├── auth.ts            # Auth API calls
│   │   ├── members.ts         # Member API calls
│   │   ├── loans.ts           # Loan API calls
│   │   ├── eligibility.ts     # Eligibility API calls
│   │   ├── repayments.ts      # Repayment API calls
│   │   ├── defaulters.ts      # Defaulter API calls
│   │   ├── reports.ts         # Report API calls
│   │   ├── dashboard.ts       # Dashboard API calls
│   │   ├── notifications.ts   # Notification API calls
│   │   ├── audit.ts           # Audit log API calls
│   │   └── config.ts          # Admin config API calls
│   │
│   ├── hooks/                 # Custom hooks
│   │   ├── use-auth.ts        # Authentication hook
│   │   ├── use-members.ts     # Member CRUD hooks
│   │   ├── use-loans.ts       # Loan hooks
│   │   ├── use-eligibility.ts # Eligibility hooks
│   │   ├── use-repayments.ts  # Repayment hooks
│   │   ├── use-defaulters.ts  # Defaulter hooks
│   │   ├── use-reports.ts     # Report hooks
│   │   ├── use-dashboard.ts   # Dashboard hooks
│   │   ├── use-notifications.ts # Notification hooks
│   │   ├── use-audit.ts       # Audit log hooks
│   │   ├── use-config.ts      # Config hooks
│   │   └── use-debounce.ts    # Search debouncing
│   │
│   ├── context/               # React Context providers
│   │   └── auth-context.tsx   # Auth context (user, role, tokens)
│   │
│   ├── lib/                   # Utility functions
│   │   ├── utils.ts           # cn() helper, general utilities
│   │   ├── formatters.ts      # Currency, date, number formatters
│   │   └── validators.ts      # Shared Zod validation schemas
│   │
│   ├── types/                 # TypeScript type definitions
│   │   ├── auth.ts            # Auth types
│   │   ├── member.ts          # Member types
│   │   ├── loan.ts            # Loan types
│   │   ├── eligibility.ts     # Eligibility types
│   │   ├── repayment.ts       # Repayment types
│   │   ├── defaulter.ts       # Defaulter types
│   │   ├── report.ts          # Report types
│   │   ├── dashboard.ts       # Dashboard types
│   │   ├── notification.ts    # Notification types
│   │   ├── audit.ts           # Audit types
│   │   └── config.ts          # Config types
│   │
│   ├── schemas/               # Zod validation schemas
│   │   ├── auth.ts            # Login, password change schemas
│   │   ├── member.ts          # Member create/edit schemas
│   │   ├── loan.ts            # Loan application schemas
│   │   ├── repayment.ts       # Repayment recording schemas
│   │   └── config.ts          # Config update schemas
│   │
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── select.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── command.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── progress.tsx
│   │   │   └── theme-provider.tsx  # Dark mode support
│   │   │
│   │   ├── layout/            # Layout components
│   │   │   ├── admin-layout.tsx      # Admin portal layout
│   │   │   ├── member-layout.tsx     # Member portal layout
│   │   │   ├── sidebar.tsx           # Responsive sidebar
│   │   │   ├── header.tsx            # Top header bar
│   │   │   ├── notification-bell.tsx # Bell dropdown in header
│   │   │   ├── user-menu.tsx         # User avatar + dropdown
│   │   │   ├── mobile-nav.tsx        # Mobile hamburger nav
│   │   │   ├── breadcrumb.tsx        # Breadcrumb navigation
│   │   │   └── page-header.tsx       # Page title + description
│   │   │
│   │   ├── data-table/        # TanStack Table wrapper
│   │   │   ├── data-table.tsx        # Base data table component
│   │   │   ├── data-table-pagination.tsx
│   │   │   ├── data-table-toolbar.tsx
│   │   │   ├── data-table-filter.tsx  # Filter dropdown component
│   │   │   ├── data-table-search.tsx  # Search input component
│   │   │   └── data-table-view-options.tsx
│   │   │
│   │   ├── charts/            # Recharts wrappers
│   │   │   ├── bar-chart.tsx
│   │   │   ├── line-chart.tsx
│   │   │   ├── pie-chart.tsx
│   │   │   ├── area-chart.tsx
│   │   │   └── chart-card.tsx  # Card wrapper with title for charts
│   │   │
│   │   ├── forms/             # Form components
│   │   │   ├── login-form.tsx
│   │   │   ├── password-change-form.tsx
│   │   │   ├── member-form.tsx
│   │   │   ├── loan-application-form.tsx
│   │   │   ├── repayment-form.tsx
│   │   │   ├── loan-type-form.tsx
│   │   │   └── eligibility-rule-form.tsx
│   │   │
│   │   ├── dashboard/         # Dashboard widgets
│   │   │   ├── stat-card.tsx          # Summary card with icon + value
│   │   │   ├── admin-overview.tsx     # Admin dashboard overview
│   │   │   ├── member-overview.tsx    # Member dashboard overview
│   │   │   ├── loans-over-time-chart.tsx
│   │   │   ├── repayments-over-time-chart.tsx
│   │   │   ├── loan-status-pie.tsx
│   │   │   ├── application-dist-chart.tsx
│   │   │   ├── defaulter-dist-chart.tsx
│   │   │   └── outstanding-amounts-chart.tsx
│   │   │
│   │   ├── eligibility/       # Eligibility display
│   │   │   ├── eligibility-score-card.tsx  # Score + recommendation display
│   │   │   ├── eligibility-breakdown.tsx   # Factor-by-factor breakdown
│   │   │   └── eligibility-reasons.tsx     # List of reasons
│   │   │
│   │   └── shared/            # Shared components
│   │       ├── loading-skeleton.tsx  # Page-level skeleton
│   │       ├── empty-state.tsx       # No data placeholder
│   │       ├── error-state.tsx       # Error display
│   │       ├── status-badge.tsx      # Colored status badge
│   │       ├── confirm-action.tsx    # Inline confirmation component
│   │       ├── search-input.tsx      # Debounced search input
│   │       ├── date-range-picker.tsx # Date range filter
│   │       └── export-button.tsx     # CSV/PDF export dropdown
│   │
│   ├── pages/                 # Page components
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   ├── forgot-password.tsx
│   │   │   └── reset-password.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── dashboard.tsx
│   │   │   ├── members/
│   │   │   │   ├── member-list.tsx
│   │   │   │   ├── member-detail.tsx
│   │   │   │   └── member-create.tsx
│   │   │   ├── loans/
│   │   │   │   ├── loan-list.tsx
│   │   │   │   ├── loan-detail.tsx
│   │   │   │   ├── application-list.tsx
│   │   │   │   └── application-detail.tsx
│   │   │   ├── repayments/
│   │   │   │   ├── repayment-list.tsx
│   │   │   │   └── repayment-record.tsx
│   │   │   ├── defaulters/
│   │   │   │   └── defaulter-list.tsx
│   │   │   ├── reports/
│   │   │   │   ├── loan-report.tsx
│   │   │   │   ├── repayment-report.tsx
│   │   │   │   ├── defaulter-report.tsx
│   │   │   │   └── eligibility-report.tsx
│   │   │   ├── audit/
│   │   │   │   └── audit-log.tsx
│   │   │   ├── config/
│   │   │   │   ├── loan-types.tsx
│   │   │   │   ├── eligibility-rules.tsx
│   │   │   │   └── system-settings.tsx
│   │   │   └── notifications/
│   │   │       └── notification-list.tsx
│   │   │
│   │   └── member/
│   │       ├── dashboard.tsx
│   │       ├── profile.tsx
│   │       ├── apply-loan.tsx
│   │       ├── my-applications.tsx
│   │       ├── my-loans.tsx
│   │       ├── loan-detail.tsx
│   │       ├── repayment-history.tsx
│   │       ├── eligibility.tsx
│   │       └── notifications.tsx
│   │
│   └── routes/
│       ├── index.tsx          # Main router definition
│       ├── admin-routes.tsx   # Admin route definitions
│       ├── member-routes.tsx  # Member route definitions
│       ├── auth-routes.tsx    # Public auth routes
│       └── guard.tsx          # Role-based route guards
```

---

## 3. Design Decisions

### 3.1 Visual Theme

**Green/white professional theme** with dark mode toggle:

- **Primary color**: Emerald green (#10B981 / Tailwind `emerald-500`) — reflects the university union identity
- **Secondary color**: Slate gray (#64748B / Tailwind `slate-500`)
- **Background**: White (#FFFFFF) / Light gray (#F8FAFC) for content areas
- **Sidebar**: Dark emerald (#065F46 / Tailwind `emerald-800`) with white text
- **Cards**: White background with subtle shadow
- **Status colors**:
  - Pending: Amber (#F59E0B)
  - Approved/Active/Paid: Emerald (#10B981)
  - Rejected: Red (#EF4444)
  - Overdue: Red (#DC2626)
  - At Risk: Orange (#F97316)
  - Defaulter: Red (#EF4444)
  - Severe Defaulter: Dark Red (#991B1B)
  - Under Review: Blue (#3B82F6)

### 3.2 Layout Structure

**Separate layouts** for Admin and Member portals:

#### Admin Layout
```
┌─────────────────────────────────────────┐
│  Header: Logo | Search | Bell | Theme | User │
├──────────┬──────────────────────────────┤
│          │  Breadcrumb                   │
│ Sidebar  │  ─────────────────────       │
│ (dark)   │  Page Content                 │
│          │                               │
│ Dashboard│                               │
│ Members  │                               │
│ Loans    │                               │
│ Apps     │                               │
│ Repay    │                               │
│ Defaultr │                               │
│ Reports  │                               │
│ Audit    │                               │
│ Config   │                               │
│ Notifs   │                               │
│          │                               │
└──────────┴──────────────────────────────┘
```

#### Member Layout
```
┌─────────────────────────────────────────┐
│  Header: Logo | Bell | Theme | User     │
├──────────┬──────────────────────────────┤
│          │  Breadcrumb                   │
│ Sidebar  │  ─────────────────────       │
│ (dark)   │  Page Content                 │
│          │                               │
│ Dashboard│                               │
│ Profile  │                               │
│ Apply    │                               │
│ Apps     │                               │
│ Loans    │                               │
│ Repay    │                               │
│ Eligibl  │                               │
│ Notifs   │                               │
│          │                               │
└──────────┴──────────────────────────────┘
```

### 3.3 Sidebar Behavior

**Responsive sidebar**:
- **Desktop**: Fixed sidebar (260px wide) with labels and icons. Collapsible to icon-only (64px) via toggle button.
- **Tablet**: Same as desktop, but can be toggled to overlay mode.
- **Mobile (<768px)**: Hidden by default. Slides in as an overlay when hamburger menu is tapped. Closes on navigation or backdrop tap.
- Sidebar highlights the active route.
- Collapsed state shows only icons with tooltips on hover.

### 3.4 Authentication Flow

1. User navigates to `/login`
2. Enters email + password
3. Frontend calls `POST /api/auth/login/` with `{ email, password }`
4. Backend returns `{ access, refresh }` JWT tokens
5. Frontend stores tokens:
   - `access` token in memory (React state / context)
   - `refresh` token in `httpOnly` cookie or secure localStorage
6. User role is extracted from JWT payload (`role` claim)
7. **Role-based redirect**:
   - Admin → `/admin/dashboard`
   - Member → `/member/dashboard`
8. Axios interceptor attaches `Authorization: Bearer <access_token>` to all requests
9. On 401 response, interceptor attempts silent refresh via `POST /api/auth/refresh/`
10. If refresh fails, redirect to `/login` with return URL

### 3.5 JWT Token Management

**Auto-refresh silently**:
- Axios response interceptor catches 401 errors
- Automatically calls `/api/auth/refresh/` with the refresh token
- On success, updates the access token and retries the original request
- If refresh fails (expired/invalid), clears tokens and redirects to `/login`
- Concurrent requests: queue requests during refresh to prevent multiple refresh calls

### 3.6 State Management

**TanStack Query for all server state**:
- Each API entity gets its own query hook with:
  - `queryKey` for caching and invalidation
  - `queryFn` that calls the API
  - `enabled` flag for conditional fetching
  - `staleTime` for cache freshness
- Mutations use `useMutation` with:
  - `onSuccess` callback to invalidate related queries
  - Optimistic updates where appropriate
  - Toast notifications for success/error

**React Context for client state**:
- `AuthContext`: user, role, tokens, login/logout functions
- `ThemeContext`: dark mode state (via shadcn/ui's theme provider)

### 3.7 Forms & Validation

**React Hook Form + Zod**:
- All forms use `useForm` from react-hook-form
- Validation schemas defined in `/schemas/` using Zod
- `@hookform/resolvers` bridges Zod schemas to react-hook-form
- shadcn/ui form components provide consistent styling
- Client-side validation on all forms (backend validation is always the source of truth)
- Form errors displayed inline below each field
- Loading states on submit buttons during API calls

### 3.8 Tables & Data Display

**TanStack Table** wrapped in a reusable `DataTable` component:
- Features: sorting, filtering, pagination, row selection (where needed)
- Server-side pagination via API `page` and `page_size` params
- Server-side search via debounced search input
- Advanced filter panel with:
  - Status filter (dropdown)
  - Date range picker
  - Type filter (dropdown)
  - Clear all filters button
- Column visibility toggle
- Export dropdown (CSV/PDF) for report tables

### 3.9 Charts

**Recharts** for all dashboard visualizations:
- Admin dashboard charts:
  - **Loans issued over time**: Area chart (monthly)
  - **Repayments over time**: Line chart (monthly)
  - **Loan status distribution**: Pie chart
  - **Application approval/rejection**: Bar chart
  - **Defaulters by classification**: Bar chart (horizontal)
  - **Outstanding loan amounts**: Bar chart by loan type
- Chart granularity: Monthly by default, with toggle to weekly/daily
- Charts render inside `ChartCard` wrapper with title and optional legend
- Responsive: charts resize with container width

### 3.10 Notifications

**Bell dropdown in header**:
- Bell icon in the top-right header area
- Unread count badge (red dot/number)
- Click opens dropdown panel showing:
  - Last 10 notifications
  - "Mark all as read" button
  - "View all" link to full notifications page
- Each notification shows: icon, title, message snippet, time ago
- Clicking a notification marks it as read and navigates to related entity (if applicable)
- Polls unread count every 30 seconds (or uses WebSocket if added later)

### 3.11 Confirmation Dialogs

**Inline confirmation** for actions:
- When user clicks "Approve", "Reject", "Record Payment", etc.
- The row/card expands to show an inline confirmation section
- Shows summary of the action (e.g., "Approve loan APP-ABC123 for K20,000?")
- Two buttons: Confirm (green) and Cancel (gray)
- Loading spinner on confirm during API call
- Toast notification on success/error
- No modal dialogs for confirmations — keeps the flow in-context

### 3.12 Loading & Error States

- **Skeleton screens**: Page-level skeletons while data loads (shimmer effect)
  - Dashboard: skeleton stat cards + chart placeholders
  - Tables: skeleton rows (5-8 rows)
  - Detail pages: skeleton text blocks
- **Toast notifications** (via `sonner`):
  - Success: green toast, auto-dismiss after 3 seconds
  - Error: red toast with error message, auto-dismiss after 5 seconds
  - Info: blue toast for neutral messages
- **Empty states**: Illustration + message + action button when no data
- **Error states**: Error icon + message + retry button

### 3.13 Report Export

**Backend-generated files**:
- Export buttons trigger a GET request to the backend export endpoint
- Backend returns a file (CSV or PDF) as a download
- Frontend uses `Blob` + `URL.createObjectURL` to trigger browser download
- Export dropdown with options: "Export CSV" and "Export PDF"
- Loading indicator on the export button during generation

### 3.14 Dark Mode

- Dark mode toggle in the header (sun/moon icon)
- Uses shadcn/ui's `ThemeProvider` with CSS variables
- Toggle state persists in `localStorage`
- Applies to all components via CSS variable overrides
- Sidebar adapts (darker green in dark mode)
- Charts adapt colors for dark mode readability

---

## 4. Pages & Features — Admin Portal

### 4.1 Login Page (`/login`)

- Centered card with UNZALARU logo
- Email input field
- Password input field with show/hide toggle
- "Sign In" button
- "Forgot Password?" link
- Form validation: email format, password required
- Error message for invalid credentials
- Loading state on submit

### 4.2 Admin Dashboard (`/admin/dashboard`)

**Summary cards** (10 cards in a responsive grid):
| Card | Value | Icon |
|---|---|---|
| Total Members | Count | Users |
| Pending Applications | Count | FileText |
| Approved Loans | Count | CheckCircle |
| Active Loans | Count | Activity |
| Total Amount Loaned | K amount | DollarSign |
| Total Amount Repaid | K amount | TrendingUp |
| Outstanding Balance | K amount | AlertTriangle |
| At-Risk Borrowers | Count | AlertCircle |
| Defaulters | Count | XCircle |
| Severe Defaulters | Count | AlertOctagon |

**Charts section** (2x3 grid):
1. Loans issued over time (area chart)
2. Repayments over time (line chart)
3. Loan status distribution (pie chart)
4. Application approval/rejection (bar chart)
5. Defaulters by classification (horizontal bar chart)
6. Outstanding loan amounts by type (bar chart)

Each chart inside a `ChartCard` with title and monthly/daily toggle.

### 4.3 Member Management

#### Member List (`/admin/members`)
- TanStack Table with columns: Member ID, Full Name, Email, Department, Employment Status, Monthly Income, Membership Status, Account Status, Date Joined
- Advanced filter panel: status, department, employment status, date range
- Search by name, email, member ID
- Click row to view detail
- "Add Member" button (opens create form)

#### Member Detail (`/admin/members/:id`)
- Profile card with all member information
- Tabs:
  - **Overview**: Basic info, employment, income
  - **Loan History**: Table of all loans with status
  - **Repayment History**: Table of all repayments
  - **Eligibility History**: Table of eligibility scores with breakdown
  - **Defaulter History**: Table of defaulter classifications
- Actions: Edit, Deactivate

#### Member Create (`/admin/members/create`)
- Multi-section form:
  - User account: email, username, first name, last name, password
  - Profile: NRC number, phone, address, department, employment status, income
- Form validation with Zod
- Success toast + redirect to member list

### 4.4 Loan Management

#### Application List (`/admin/loans/applications`)
- TanStack Table with columns: Application ID, Member Name, Member ID, Loan Type, Amount, Duration, Status, Date Applied
- Status filter: PENDING, UNDER_REVIEW, APPROVED, REJECTED, CANCELLED
- Search by application ID, member name
- Click row to view detail
- Status badges with colors

#### Application Detail (`/admin/loans/applications/:id`)
- Application info card with all fields
- Eligibility score display (score card + breakdown + reasons)
- **Action section** (for PENDING/UNDER_REVIEW):
  - "Approve" button → inline confirmation → calls approve endpoint
  - "Reject" button → inline confirmation with reason input → calls reject endpoint
- Status timeline showing application progression
- Related loan info (if approved)

#### Loan List (`/admin/loans`)
- TanStack Table with columns: Loan ID, Member Name, Member ID, Loan Type, Principal, Amount Repaid, Outstanding Balance, Status, Date Approved
- Status filter: ACTIVE, COMPLETED, DEFAULTED, WRITTEN_OFF
- Search by loan ID, member name
- Click row to view detail

#### Loan Detail (`/admin/loans/:id`)
- Loan info card: principal, interest, total repayment, monthly installment, outstanding balance
- Repayment schedule table (installment number, due date, expected, paid, remaining, status)
- Repayment history table for this loan
- Actions: Record Repayment (inline form)

### 4.5 Repayment Management

#### Repayment List (`/admin/repayments`)
- TanStack Table with columns: Repayment ID, Loan ID, Member, Amount, Payment Date, Recorded By, Notes
- Search by repayment ID, loan ID
- Filter by date range

#### Record Repayment (`/admin/repayments/record`)
- Loan search by loan ID
- Display loan summary and current schedule
- Payment form: amount, optional schedule selection, notes
- Preview of how payment will be applied
- Inline confirmation → submit

### 4.6 Defaulter Dashboard (`/admin/defaulters`)

- Summary cards: At Risk count, Defaulter count, Severe Defaulter count
- TanStack Table with columns: Member Name, Member ID, Loan ID, Loan Amount, Outstanding Amount, Days Overdue, Classification, Last Checked
- Classification filter: AT_RISK, DEFAULTER, SEVERE_DEFAULTER
- Color-coded rows based on classification
- Click row to view member detail
- "Update Statuses" button to trigger manual defaulter recalculation

### 4.7 Reports

#### Report Pages (`/admin/reports/*`)
Each report page has:
- Advanced filter panel (date range, member, status)
- Data table with relevant columns
- Export dropdown (CSV, PDF)

**Loan Report**: Loan ID, Member, Amount, Interest, Total Repayment, Duration, Status, Date Approved
**Repayment Report**: Member, Loan ID, Expected Payment, Actual Payment, Payment Date, Outstanding Balance, Status
**Defaulter Report**: Member, Loan ID, Amount Overdue, Days Overdue, Classification
**Eligibility Report**: Member, Application ID, Score, Breakdown, Recommendation, Final Decision

### 4.8 Audit Log (`/admin/audit`)

- TanStack Table with columns: Timestamp, User, Action, Entity Type, Entity ID, Description
- Filter by action type, entity type, date range
- Search by description, entity ID
- Read-only (no actions)

### 4.9 Admin Configuration

#### Loan Types (`/admin/config/loan-types`)
- Table of loan types with actions
- Create/Edit form: name, description, amounts, durations, interest rate, method, allow multiple

#### Eligibility Rules (`/admin/config/eligibility-rules`)
- Table of scoring rules
- Edit form: name, factor, weight, thresholds (JSON editor or structured form)

#### System Settings (`/admin/config/system`)
- Key-value pairs for system configuration
- Edit form for each setting

### 4.10 Admin Notifications (`/admin/notifications`)
- Full notification list page
- Mark as read, mark all as read
- Filter by type, read status

---

## 5. Pages & Features — Member Portal

### 5.1 Member Dashboard (`/member/dashboard`)

**Summary cards**:
- Eligibility Score (with color: green/yellow/red)
- Current Loan status
- Outstanding Balance
- Next Payment amount + due date
- Borrower Status (Current / At Risk / Defaulter / Severe Defaulter)

**Quick actions**: Apply for Loan, View My Loans, View Repayment History

**Loan history summary** (last 5 loans as cards)

### 5.2 Member Profile (`/member/profile`)
- Display all profile information (read-only for member)
- Edit form for: phone number, address (self-service fields)

### 5.3 Apply for Loan (`/member/apply-loan`)

**Multi-step wizard**:

**Step 1 — Select Loan Type**
- Cards showing available loan types with:
  - Name, description
  - Interest rate, method
  - Amount range
  - Duration range
- Select one to proceed

**Step 2 — Loan Details**
- Requested amount (slider or input, validated against min/max)
- Duration in months (slider or input, validated against min/max)
- Purpose (textarea)
- Auto-calculated preview: estimated monthly installment, total repayment

**Step 3 — Personal & Employment Info**
- Pre-filled from profile (editable)
- Employment status, income, obligations

**Step 4 — Review & Submit**
- Summary of all entered information
- Eligibility score displayed (calculated on submission)
- Score breakdown and recommendation shown
- **Submit Application** button with inline confirmation
- Cancel button

### 5.4 My Applications (`/member/my-applications`)
- Table of member's own applications
- Status badges
- Click to view detail (read-only, with status timeline)

### 5.5 My Loans (`/member/my-loans`)
- Table of member's loans
- Click to view detail

### 5.6 Loan Detail (`/member/my-loans/:id`)
- Loan summary card
- Repayment schedule table
- Repayment history
- Outstanding balance

### 5.7 Repayment History (`/member/repayment-history`)
- Full repayment history table for the member
- Summary stats: total paid, outstanding

### 5.8 Eligibility (`/member/eligibility`)
- List of eligibility scores from past applications
- Score breakdown details

### 5.9 Member Notifications (`/member/notifications`)
- Full notification list
- Mark as read

---

## 6. API Integration

### 6.1 API Client (`api/client.ts`)

```typescript
// Axios instance configuration
- baseURL: import.meta.env.VITE_API_BASE_URL (default: http://localhost:8000/api)
- Request interceptor: attach Authorization header
- Response interceptor: handle 401 → auto-refresh → retry
- Timeout: 30 seconds
```

### 6.2 Environment Variables

```
VITE_API_BASE_URL=http://localhost:8000/api
```

### 6.3 API Endpoints Consumed

| Category | Method | Endpoint | Used By |
|---|---|---|---|
| Auth | POST | `/api/auth/login/` | Login page |
| Auth | POST | `/api/auth/refresh/` | Token refresh interceptor |
| Auth | POST | `/api/auth/logout/` | Logout action |
| Auth | POST | `/api/auth/password-change/` | Password change form |
| Members | GET | `/api/members/` | Member list |
| Members | POST | `/api/members/` | Create member |
| Members | GET | `/api/members/:id/` | Member detail |
| Members | PUT | `/api/members/:id/` | Edit member |
| Members | GET | `/api/members/:id/loan-history/` | Member loan history |
| Members | GET | `/api/members/:id/repayment-history/` | Member repayment history |
| Members | GET | `/api/members/:id/eligibility-history/` | Member eligibility history |
| Members | GET | `/api/members/:id/defaulter-history/` | Member defaulter history |
| Loan Types | GET | `/api/loan-types/` | Loan type config, apply form |
| Loan Types | POST | `/api/loan-types/` | Create loan type |
| Loan Types | PUT | `/api/loan-types/:id/` | Edit loan type |
| Loan Apps | GET | `/api/loan-applications/` | Application list |
| Loan Apps | POST | `/api/loan-applications/` | Submit application |
| Loan Apps | GET | `/api/loan-applications/:id/` | Application detail |
| Loan Apps | PUT | `/api/loan-applications/:id/approve/` | Approve application |
| Loan Apps | PUT | `/api/loan-applications/:id/reject/` | Reject application |
| Loan Apps | PUT | `/api/loan-applications/:id/cancel/` | Cancel application |
| Loans | GET | `/api/loans/` | Loan list |
| Loans | GET | `/api/loans/:id/` | Loan detail |
| Loans | GET | `/api/loans/:id/schedule/` | Repayment schedule |
| Loans | GET | `/api/loans/:id/repayments/` | Loan repayments |
| Eligibility | GET | `/api/eligibility/scores/` | Eligibility scores |
| Eligibility | POST | `/api/eligibility/scores/recalculate/:app_id/` | Recalculate |
| Eligibility | GET | `/api/eligibility/rules/` | Eligibility rules |
| Repayments | POST | `/api/repayments/` | Record repayment |
| Repayments | GET | `/api/repayments/` | Repayment list |
| Defaulters | GET | `/api/defaulters/` | Defaulter list |
| Defaulters | POST | `/api/defaulters/update_statuses/` | Manual update |
| Defaulters | GET | `/api/defaulters/member/:member_id/` | Member defaulter history |
| Dashboard | GET | `/api/dashboard/admin/summary/` | Admin dashboard |
| Dashboard | GET | `/api/dashboard/admin/charts/:chart_type/` | Admin charts |
| Dashboard | GET | `/api/dashboard/member/` | Member dashboard |
| Reports | GET | `/api/reports/loans/` | Loan report |
| Reports | GET | `/api/reports/repayments/` | Repayment report |
| Reports | GET | `/api/reports/defaulters/` | Defaulter report |
| Reports | GET | `/api/reports/eligibility/` | Eligibility report |
| Reports | GET | `/api/reports/loans/export/csv/` | Export loans CSV |
| Reports | GET | `/api/reports/loans/export/pdf/` | Export loans PDF |
| Reports | GET | `/api/reports/repayments/export/csv/` | Export repayments CSV |
| Reports | GET | `/api/reports/repayments/export/pdf/` | Export repayments PDF |
| Notifications | GET | `/api/notifications/` | Notification list |
| Notifications | PUT | `/api/notifications/:id/read/` | Mark as read |
| Notifications | POST | `/api/notifications/mark-all-read/` | Mark all read |
| Notifications | GET | `/api/notifications/unread-count/` | Bell badge |
| Audit | GET | `/api/audit/` | Audit log list |
| Config | GET | `/api/admin/config/loan-types/` | Config loan types |
| Config | POST | `/api/admin/config/loan-types/` | Create loan type |
| Config | PUT | `/api/admin/config/loan-types/:id/` | Edit loan type |
| Config | GET | `/api/admin/config/eligibility-rules/` | Config rules |
| Config | PUT | `/api/admin/config/eligibility-rules/:id/` | Edit rules |
| Config | GET | `/api/admin/config/system/` | System config |
| Config | PUT | `/api/admin/config/system/` | Update system config |
| Users | GET | `/api/auth/users/` | User management (admin) |
| Users | POST | `/api/auth/users/` | Create user (admin) |
| Users | PUT | `/api/auth/users/:id/` | Edit user (admin) |

---

## 7. Routing Structure

### 7.1 Route Definitions

```
/login                          → LoginPage
/forgot-password                → ForgotPasswordPage
/reset-password                 → ResetPasswordPage

/admin                          → AdminLayout (protected, ADMIN role)
  /admin/dashboard              → AdminDashboard
  /admin/members                → MemberList
  /admin/members/create         → MemberCreate
  /admin/members/:id            → MemberDetail
  /admin/loans                  → LoanList
  /admin/loans/:id              → LoanDetail
  /admin/loans/applications     → ApplicationList
  /admin/loans/applications/:id → ApplicationDetail
  /admin/repayments             → RepaymentList
  /admin/repayments/record      → RepaymentRecord
  /admin/defaulters             → DefaulterList
  /admin/reports/loans          → LoanReport
  /admin/reports/repayments     → RepaymentReport
  /admin/reports/defaulters     → DefaulterReport
  /admin/reports/eligibility    → EligibilityReport
  /admin/audit                  → AuditLog
  /admin/config/loan-types      → LoanTypeConfig
  /admin/config/eligibility-rules → EligibilityRuleConfig
  /admin/config/system          → SystemSettings
  /admin/notifications          → NotificationList

/member                         → MemberLayout (protected, MEMBER role)
  /member/dashboard             → MemberDashboard
  /member/profile               → MemberProfile
  /member/apply-loan            → ApplyLoan
  /member/my-applications       → MyApplications
  /member/my-loans              → MyLoans
  /member/my-loans/:id          → LoanDetail
  /member/repayment-history     → RepaymentHistory
  /member/eligibility           → Eligibility
  /member/notifications         → NotificationList
```

### 7.2 Route Guards

- `AuthGuard`: Redirects to `/login` if not authenticated
- `AdminGuard`: Redirects to `/member/dashboard` if authenticated but not ADMIN
- `MemberGuard`: Redirects to `/admin/dashboard` if authenticated but not MEMBER
- `GuestGuard`: Redirects to `/admin/dashboard` or `/member/dashboard` if already authenticated

---

## 8. Reusable Components

### 8.1 DataTable

Base TanStack Table component with:
- Column definitions passed as props
- Built-in pagination (page size selector: 10, 20, 50, 100)
- Sorting (click column header)
- Search input (debounced, calls API with search param)
- Advanced filter panel (collapsible)
- Empty state when no results
- Loading skeleton when fetching

### 8.2 StatCard

Dashboard summary card:
- Icon (lucide-react)
- Label (e.g., "Total Members")
- Value (number or currency)
- Optional trend indicator (up/down arrow + percentage)
- Optional subtitle

### 8.3 StatusBadge

Colored badge for statuses:
- Maps status strings to colors and labels
- Consistent across all pages
- Supports: Pending, Approved, Rejected, Active, Completed, Paid, Overdue, At Risk, Defaulter, Severe Defaulter, Current, Under Review, etc.

### 8.4 EligibilityScoreCard

Displays eligibility score for an application:
- Circular progress indicator showing score (0-100)
- Color: green (70+), yellow (40-69), red (<40)
- Recommendation badge: ELIGIBLE, REVIEW, NOT ELIGIBLE
- Factor breakdown with individual scores
- Reasons list with checkmark/X icons

### 8.5 LoadingSkeleton

Page-level skeleton:
- Configurable layout (table, dashboard, detail)
- Shimmer animation
- Matches the approximate layout of the actual content

### 8.6 EmptyState

When no data is found:
- Icon (lucide-react)
- Title (e.g., "No loans found")
- Description (e.g., "There are no loans matching your filters")
- Optional action button (e.g., "Apply for a loan")

### 8.7 ConfirmAction

Inline confirmation component:
- Triggered by a button click
- Expands to show confirmation text and action buttons
- Confirm (green) + Cancel (gray) buttons
- Loading state on confirm
- Keyboard support (Escape to cancel, Enter to confirm)

### 8.8 ExportButton

Dropdown button for report exports:
- "Export as CSV" option
- "Export as PDF" option
- Loading state during download
- Uses backend export endpoints

---

## 9. Currency & Formatting

- **Currency**: Zambian Kwacha (K)
- **Format**: `K12,345.67` (with comma separators, 2 decimal places)
- **Date format**: `DD MMM YYYY` (e.g., "21 Aug 2026")
- **DateTime format**: `DD MMM YYYY, HH:mm`
- **Relative time**: "2 hours ago", "3 days ago" (for notifications)

---

## 10. Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile | < 640px | Single column, hamburger nav, stacked cards |
| Tablet | 640px - 1024px | 2-column grid, collapsible sidebar |
| Desktop | > 1024px | Full sidebar, 3-4 column grid, all features visible |

---

## 11. Performance Considerations

- **Code splitting**: Each route lazily loaded with `React.lazy` + `Suspense`
- **Query caching**: TanStack Query caches API responses, reducing redundant requests
- **Debounced search**: 300ms debounce on search inputs to avoid excessive API calls
- **Optimistic updates**: Mutations update local state immediately, then sync with server
- **Image optimization**: Use SVG icons (lucide-react) instead of image files
- **Virtual scrolling**: Not needed for expected data volumes (max ~1000 rows per table)

---

## 12. Security Considerations

- JWT tokens stored securely (access in memory, refresh in httpOnly cookie or localStorage)
- No sensitive data in URL parameters
- XSS protection: React's built-in escaping + Content Security Policy
- CSRF: Not needed for JWT-based auth (stateless)
- Role-based access: All API calls go through Axios interceptor that attaches token; backend enforces permissions
- Frontend route guards prevent unauthorized page access (backend is still the source of truth)

---

## 13. Implementation Order

### Phase 1 — Foundation
1. Initialize Vite + React + TypeScript project
2. Install all dependencies
3. Configure Tailwind CSS + shadcn/ui
4. Set up dark mode theme provider
5. Create API client with Axios interceptors
6. Create auth context and hooks
7. Build login page
8. Set up React Router with route guards
9. Build responsive sidebar layout (Admin + Member)
10. Build header with notification bell + user menu

### Phase 2 — Core Components
11. DataTable component (TanStack Table wrapper)
12. StatCard component
13. StatusBadge component
14. LoadingSkeleton component
15. EmptyState component
16. ConfirmAction component
17. ExportButton component
18. SearchInput component (debounced)
19. DateRangePicker component
20. FilterPanel component

### Phase 3 — Admin Dashboard
21. Admin dashboard page
22. Summary cards (10 stat cards)
23. Charts (6 Recharts visualizations)
24. Chart granularity toggle

### Phase 4 — Member Management
25. Member list page with DataTable
26. Member detail page with tabs
27. Member create form

### Phase 5 — Loan Management
28. Application list page
29. Application detail page with approve/reject
30. Loan list page
31. Loan detail page with schedule

### Phase 6 — Repayments & Defaulters
32. Repayment list page
33. Record repayment form
34. Defaulter dashboard with table and filters

### Phase 7 — Member Portal
35. Member dashboard page
36. Member profile page
37. Multi-step loan application wizard
38. My applications page
39. My loans page
40. Repayment history page
41. Eligibility page

### Phase 8 — Reports & Config
42. Report pages (4 reports)
43. Report export functionality
44. Admin config pages (loan types, eligibility rules, system settings)

### Phase 9 — Notifications & Audit
45. Notification bell with dropdown
46. Notification list page
47. Audit log page

### Phase 10 — Polish
48. Dark mode implementation
49. Responsive design pass
50. Loading states pass
51. Error states pass
52. Empty states pass
53. Form validation pass
54. Final UI/UX review

---

## 14. Development Setup

### Prerequisites
- Node.js 18+
- npm 10+

### Setup Commands

```bash
# Initialize project
cd frontend
npm create vite@latest . -- --template react-ts
npm install

# Install core dependencies
npm install react-router-dom axios @tanstack/react-query @tanstack/react-table
npm install react-hook-form @hookform/resolvers zod
npm install recharts date-fns sonner lucide-react

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install shadcn/ui dependencies
npm install class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-tabs
npm install @radix-ui/react-tooltip @radix-ui/react-popover
npm install @radix-ui/react-scroll-area @radix-ui/react-separator
npm install @radix-ui/react-avatar @radix-ui/react-progress
npm install cmdk tailwindcss-animate

# Initialize shadcn/ui
npx shadcn@latest init

# Add shadcn/ui components
npx shadcn@latest add button input label card table dialog alert-dialog
npx shadcn@latest add dropdown-menu select textarea badge avatar separator
npx shadcn@latest add skeleton sheet tabs tooltip popover calendar
npx shadcn@latest add command scroll-area pagination progress
```

### Environment Variables

```
# .env.example
VITE_API_BASE_URL=http://localhost:8000/api
```

### Running

```bash
npm run dev       # Development server (port 5173)
npm run build     # Production build
npm run preview   # Preview production build
```

---

## 15. Acceptance Criteria

The frontend is considered complete when:

1. ✅ Login/logout works with JWT tokens
2. ✅ Silent token refresh on expiry
3. ✅ Role-based redirect (admin/member)
4. ✅ Admin dashboard shows all 10 summary cards with real data
5. ✅ Admin dashboard shows all 6 charts with real data
6. ✅ Member management: list, create, detail with tabs
7. ✅ Loan application list, detail, approve, reject
8. ✅ Loan list, detail with schedule and repayments
9. ✅ Repayment recording with inline confirmation
10. ✅ Defaulter dashboard with classification filters
11. ✅ All 4 report pages with advanced filters
12. ✅ CSV and PDF export from backend
13. ✅ Member dashboard with summary cards
14. ✅ Multi-step loan application wizard
15. ✅ Member profile view/edit
16. ✅ Member loan applications, loans, repayment history
17. ✅ Bell notification dropdown in header
18. ✅ Notification list page
19. ✅ Audit log page
20. ✅ Admin config pages (loan types, eligibility rules, system settings)
21. ✅ Dark mode toggle
22. ✅ Responsive design (mobile, tablet, desktop)
23. ✅ Loading skeletons on all data-fetching pages
24. ✅ Toast notifications for success/error
25. ✅ Empty states on all list pages
26. ✅ Inline confirmations for destructive actions
27. ✅ Advanced filter panels on all list pages
28. ✅ All Zod validation schemas
29. ✅ No placeholder pages — all functionality connected to backend
30. ✅ No frontend-only mock data — all data from API

---

## 16. File Naming Conventions

- Components: `kebab-case.tsx` (e.g., `stat-card.tsx`)
- Hooks: `use-[entity].ts` (e.g., `use-members.ts`)
- API files: `[entity].ts` (e.g., `loans.ts`)
- Type files: `[entity].ts` in `/types/` (e.g., `loan.ts`)
- Schema files: `[entity].ts` in `/schemas/` (e.g., `loan.ts`)
- Page files: `kebab-case.tsx` (e.g., `member-list.tsx`)

---

## 17. Key Differences from Backend Spec

| Aspect | Backend Spec | Frontend Adaptation |
|---|---|---|
| Auth | Email + password login | Same, with JWT auto-refresh |
| Pagination | PageNumberPagination (page, page_size) | DataTable with server-side pagination |
| Filtering | django-filter backend | Advanced filter panel sending query params |
| Search | SearchFilter backend | Debounced search input sending search param |
| Export | Backend returns file | Frontend triggers download via Blob |
| Charts | Backend returns aggregated data | Recharts consumes the data |
| Forms | Backend validates | Frontend validates with Zod + shows errors |
| Notifications | Backend creates | Frontend polls unread count + renders bell |
| Dark mode | N/A (backend) | CSS variables + theme provider |
