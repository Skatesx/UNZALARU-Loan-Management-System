import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/auth-context'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { RoleGuard, GuestGuard } from '@/routes/guard'
import { AdminLayout } from '@/components/layout/admin-layout'
import { MemberLayout } from '@/components/layout/member-layout'
import { SupervisorLayout } from '@/components/layout/supervisor-layout'
import { LoginPage } from '@/pages/auth/login'
import { SignupPage } from '@/pages/auth/signup'
import { ForgotPasswordPage } from '@/pages/auth/forgot-password'
import { AdminDashboard } from '@/pages/admin/dashboard'
import { MemberList } from '@/pages/admin/members/member-list'
import { MemberDetail } from '@/pages/admin/members/member-detail'
import { MemberCreate } from '@/pages/admin/members/member-create'
import { ApplicationList } from '@/pages/admin/loans/application-list'
import { ApplicationDetail } from '@/pages/admin/loans/application-detail'
import { LoanList } from '@/pages/admin/loans/loan-list'
import { LoanDetail as AdminLoanDetail } from '@/pages/admin/loans/loan-detail'
import { RepaymentList } from '@/pages/admin/repayments/repayment-list'
import { DefaulterList } from '@/pages/admin/defaulters/defaulter-list'
import { LoanReport } from '@/pages/admin/reports/loan-report'
import { RepaymentReport } from '@/pages/admin/reports/repayment-report'
import { DefaulterReport } from '@/pages/admin/reports/defaulter-report'
import { EligibilityReport } from '@/pages/admin/reports/eligibility-report'
import { AuditLog } from '@/pages/admin/audit/audit-log'
import { LoanTypeConfig } from '@/pages/admin/config/loan-types'
import { EligibilityRuleConfig } from '@/pages/admin/config/eligibility-rules'
import { AdminNotificationList } from '@/pages/admin/notifications/notification-list'
import { MemberDashboard } from '@/pages/member/dashboard'
import { MemberProfile } from '@/pages/member/profile'
import { ApplyLoan } from '@/pages/member/apply-loan'
import { MyApplications } from '@/pages/member/my-applications'
import { MyLoans } from '@/pages/member/my-loans'
import { LoanDetail as MemberLoanDetail } from '@/pages/member/loan-detail'
import { RepaymentHistory } from '@/pages/member/repayment-history'
import { Eligibility } from '@/pages/member/eligibility'
import { MemberNotificationList } from '@/pages/member/notifications'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route
                  path="/login"
                  element={
                    <GuestGuard>
                      <LoginPage />
                    </GuestGuard>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <GuestGuard>
                      <SignupPage />
                    </GuestGuard>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <GuestGuard>
                      <ForgotPasswordPage />
                    </GuestGuard>
                  }
                />

                {/* Admin routes (ADMIN only) */}
                <Route
                  path="/admin"
                  element={
                    <RoleGuard roles={['ADMIN']}>
                      <AdminLayout />
                    </RoleGuard>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="members" element={<MemberList />} />
                  <Route path="members/create" element={<MemberCreate />} />
                  <Route path="members/:id" element={<MemberDetail />} />
                  <Route path="loans" element={<LoanList />} />
                  <Route path="loans/:id" element={<AdminLoanDetail />} />
                  <Route path="loans/applications" element={<ApplicationList />} />
                  <Route path="loans/applications/:id" element={<ApplicationDetail />} />
                  <Route path="repayments" element={<RepaymentList />} />
                  <Route path="defaulters" element={<DefaulterList />} />
                  <Route path="reports/loans" element={<LoanReport />} />
                  <Route path="reports/repayments" element={<RepaymentReport />} />
                  <Route path="reports/defaulters" element={<DefaulterReport />} />
                  <Route path="reports/eligibility" element={<EligibilityReport />} />
                  <Route path="audit" element={<AuditLog />} />
                  <Route path="config/loan-types" element={<LoanTypeConfig />} />
                  <Route path="config/eligibility-rules" element={<EligibilityRuleConfig />} />
                  <Route path="notifications" element={<AdminNotificationList />} />
                </Route>

                {/* Supervisor routes (SUPERVISOR only) */}
                <Route
                  path="/supervisor"
                  element={
                    <RoleGuard roles={['SUPERVISOR']}>
                      <SupervisorLayout />
                    </RoleGuard>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="members" element={<MemberList />} />
                  <Route path="members/:id" element={<MemberDetail />} />
                  <Route path="loans" element={<LoanList />} />
                  <Route path="loans/:id" element={<AdminLoanDetail />} />
                  <Route path="loans/applications" element={<ApplicationList />} />
                  <Route path="loans/applications/:id" element={<ApplicationDetail />} />
                  <Route path="repayments" element={<RepaymentList />} />
                  <Route path="defaulters" element={<DefaulterList />} />
                  <Route path="reports/loans" element={<LoanReport />} />
                  <Route path="reports/repayments" element={<RepaymentReport />} />
                  <Route path="reports/defaulters" element={<DefaulterReport />} />
                  <Route path="reports/eligibility" element={<EligibilityReport />} />
                  <Route path="audit" element={<AuditLog />} />
                  <Route path="notifications" element={<AdminNotificationList />} />
                </Route>

                {/* Member routes (MEMBER only) */}
                <Route
                  path="/member"
                  element={
                    <RoleGuard roles={['MEMBER']}>
                      <MemberLayout />
                    </RoleGuard>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<MemberDashboard />} />
                  <Route path="profile" element={<MemberProfile />} />
                  <Route path="apply-loan" element={<ApplyLoan />} />
                  <Route path="my-applications" element={<MyApplications />} />
                  <Route path="my-loans" element={<MyLoans />} />
                  <Route path="my-loans/:id" element={<MemberLoanDetail />} />
                  <Route path="repayment-history" element={<RepaymentHistory />} />
                  <Route path="eligibility" element={<Eligibility />} />
                  <Route path="notifications" element={<MemberNotificationList />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
              <Toaster position="top-right" richColors />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
