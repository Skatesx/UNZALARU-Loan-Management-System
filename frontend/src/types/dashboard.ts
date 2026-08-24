export interface AdminDashboardSummary {
  total_members: number
  pending_applications: number
  approved_loans: number
  active_loans: number
  total_amount_loaned: number
  total_amount_repaid: number
  outstanding_balance: number
  at_risk_borrowers: number
  defaulters: number
  severe_defaulters: number
}

export interface ChartDataPoint {
  month?: string
  count?: number
  total?: number
  status?: string
  classification?: string
  loan_type__name?: string
}

export interface MemberDashboardSummary {
  eligibility_score: number | null
  current_loan: {
    loan_id: string
    principal: number
    monthly_installment: number
    outstanding_balance: number
  } | null
  outstanding_balance: number
  next_payment: {
    amount: number
    due_date: string
  } | null
  borrower_status: string
  loan_applications_count: number
  loan_history_count: number
}
