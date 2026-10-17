import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

export type DeductionMatch = 'FULL' | 'PARTIAL' | 'NOT_DEDUCTED' | 'OVER'

export interface DeductionRow {
  loan_id: string
  member_id: string
  member_name: string
  school: string
  department: string
  current_due: string
  arrears: string
  amount_due: string
  /** Present for confirmed months and matched returns */
  amount_deducted?: string
  match?: DeductionMatch
}

export interface DeductionTotals {
  members: number
  current_due: string
  arrears: string
  amount_due: string
  amount_deducted?: string
}

export interface PayrollMonth {
  month: string
  confirmed: boolean
  run: {
    confirmed_by: string | null
    confirmed_at: string
    total_due: string
    total_deducted: string
    bank_amount: string | null
    notes: string
  } | null
  rows: DeductionRow[]
  totals: DeductionTotals
}

export interface PayrollReturnMatch {
  month: string
  rows: DeductionRow[]
  unknown: { member_id: string; amount: string }[]
  file_total: string
  totals: DeductionTotals
}

export function usePayrollMonth(month: string) {
  return useQuery({
    queryKey: ['payroll', month],
    queryFn: async () => {
      const response = await apiClient.get<PayrollMonth>('/payroll/deductions/', { params: { month } })
      return response.data
    },
    enabled: Boolean(month),
  })
}

export function useMatchPayrollReturn() {
  return useMutation({
    mutationFn: async ({ month, file }: { month: string; file: File }) => {
      const form = new FormData()
      form.append('month', month)
      form.append('file', file)
      const response = await apiClient.post<PayrollReturnMatch>('/payroll/deductions/match/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    },
  })
}

export function useConfirmPayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      month: string
      deductions: { loan_id: string; amount_deducted: string }[]
      bank_amount?: string
      notes?: string
    }) => {
      const response = await apiClient.post('/payroll/deductions/confirm/', data)
      return response.data
    },
    onSuccess: () => {
      // Payments change balances, schedules, defaulters and every report
      queryClient.invalidateQueries()
    },
  })
}

export async function downloadPayrollFile(month: string, format: 'csv' | 'pdf' | 'template') {
  const response = await apiClient.get(`/payroll/deductions/export/${format}/`, {
    params: { month },
    responseType: 'blob',
  })
  const stamp = month.replace('-', '_')
  const name = format === 'template'
    ? `payroll_return_${stamp}.csv`
    : `payroll_deductions_${stamp}.${format}`
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', name)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
