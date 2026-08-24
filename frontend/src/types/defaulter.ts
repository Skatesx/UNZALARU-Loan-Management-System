export type DefaulterClassification = 'CURRENT' | 'AT_RISK' | 'DEFAULTER' | 'SEVERE_DEFAULTER'

export interface DefaulterStatus {
  id: number
  member: number
  member_name: string
  member_id: string
  member_email: string
  member_phone: string
  loan: number
  loan_id: string
  loan_amount: number
  outstanding_amount: number
  schedule: number
  days_overdue: number
  classification: DefaulterClassification
  last_checked: string
  created_at: string
}

export interface DefaulterStatusListItem {
  id: number
  member_name: string
  member_id: string
  loan_id: string
  days_overdue: number
  classification: DefaulterClassification
  last_checked: string
}
