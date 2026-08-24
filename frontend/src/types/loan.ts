import type { MemberListItem } from './member'

export type LoanApplicationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type LoanStatus = 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'WRITTEN_OFF'
export type InterestMethod = 'FLAT' | 'REDUCING_BALANCE'

export interface LoanType {
  id: number
  name: string
  description: string
  min_amount: number
  max_amount: number
  min_duration_months: number
  max_duration_months: number
  interest_rate: number
  interest_method: InterestMethod
  allow_multiple_active: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LoanApplication {
  id: number
  application_id: string
  member: MemberListItem
  loan_type: number
  loan_type_name: string
  requested_amount: number
  duration_months: number
  purpose: string
  application_date: string
  current_employment_info: Record<string, unknown>
  income_info: Record<string, unknown>
  existing_loan_obligations: unknown[]
  status: LoanApplicationStatus
  rejection_reason: string
  reviewed_by: number | null
  reviewed_by_name: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface LoanApplicationListItem {
  id: number
  application_id: string
  member_name: string
  member_id: string
  loan_type: number
  loan_type_name: string
  requested_amount: number
  duration_months: number
  status: LoanApplicationStatus
  application_date: string
}

export interface LoanApplicationCreateRequest {
  loan_type: number
  requested_amount: number
  duration_months: number
  purpose: string
  current_employment_info?: Record<string, unknown>
  income_info?: Record<string, unknown>
  existing_loan_obligations?: unknown[]
}

export interface RejectApplicationRequest {
  reason: string
}

export interface Loan {
  id: number
  loan_id: string
  application: number
  member: MemberListItem
  loan_type: number
  loan_type_name: string
  principal: number
  interest_rate: number
  interest_method: InterestMethod
  total_interest: number
  total_repayment: number
  duration_months: number
  monthly_installment: number
  amount_repaid: number
  outstanding_balance: number
  status: LoanStatus
  date_approved: string
  approved_by: number | null
  approved_by_name: string | null
  created_at: string
  updated_at: string
}

export interface LoanListItem {
  id: number
  loan_id: string
  member_name: string
  member_id: string
  loan_type_name: string
  principal: number
  total_repayment: number
  amount_repaid: number
  outstanding_balance: number
  status: LoanStatus
  date_approved: string
}
