export type RepaymentScheduleStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE'

export type PaymentMode =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'MOBILE_MONEY'
  | 'CHEQUE'
  | 'SALARY_DEDUCTION'
  | 'OTHER'

export const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  MOBILE_MONEY: 'Mobile Money',
  CHEQUE: 'Cheque',
  SALARY_DEDUCTION: 'Salary Deduction',
  OTHER: 'Other',
}

export interface RepaymentSchedule {
  id: number
  installment_id: string
  loan: number
  loan_id: string
  installment_number: number
  due_date: string
  expected_amount: number
  amount_paid: number
  remaining_amount: number
  payment_status: RepaymentScheduleStatus
  days_overdue: number
  created_at: string
  updated_at: string
}

export interface Repayment {
  id: number
  repayment_id: string
  loan: number
  loan_id: string
  schedule: number
  installment_number: number
  amount: number
  payment_mode: PaymentMode
  payment_date: string
  recorded_by: number | null
  recorded_by_name: string | null
  notes: string
  created_at: string
}

export interface RepaymentCreateRequest {
  loan_id: string
  amount: number
  payment_mode?: PaymentMode
  schedule_id?: string
  notes?: string
}
