import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type {
  LoanType,
  LoanApplication,
  LoanApplicationListItem,
  LoanApplicationCreateRequest,
  RejectApplicationRequest,
  Loan,
  LoanListItem,
} from '@/types/loan'
import type { RepaymentSchedule, Repayment } from '@/types/repayment'

interface PaginatedResponse<T> {
  count: number
  results: T[]
}

// Loan Types
export function useLoanTypes() {
  return useQuery({
    queryKey: ['loan-types'],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<LoanType>>('/loan-types/')
      return response.data.results || response.data
    },
  })
}

export function useCreateLoanType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<LoanType>) => {
      const response = await apiClient.post('/loan-types/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-types'] })
    },
  })
}

export function useUpdateLoanType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LoanType> }) => {
      const response = await apiClient.put(`/loan-types/${id}/`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-types'] })
    },
  })
}

// Loan Applications
export function useLoanApplications(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['loan-applications', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<LoanApplicationListItem>>('/loan-applications/', { params })
      return response.data
    },
  })
}

export function useLoanApplication(id: number) {
  return useQuery({
    queryKey: ['loan-applications', id],
    queryFn: async () => {
      const response = await apiClient.get<LoanApplication>(`/loan-applications/${id}/`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useCreateLoanApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: LoanApplicationCreateRequest) => {
      const response = await apiClient.post('/loan-applications/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] })
    },
  })
}

export function useApproveLoanApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/loan-applications/${id}/approve/`, {})
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] })
      queryClient.invalidateQueries({ queryKey: ['loans'] })
    },
  })
}

export function useRejectLoanApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RejectApplicationRequest }) => {
      const response = await apiClient.put(`/loan-applications/${id}/reject/`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] })
    },
  })
}

export function useCancelLoanApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/loan-applications/${id}/cancel/`, {})
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] })
    },
  })
}

// Loans
export function useLoans(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['loans', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<LoanListItem>>('/loans/', { params })
      return response.data
    },
  })
}

export function useLoan(id: number) {
  return useQuery({
    queryKey: ['loans', id],
    queryFn: async () => {
      const response = await apiClient.get<Loan>(`/loans/${id}/`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useLoanSchedule(loanId: number) {
  return useQuery({
    queryKey: ['loans', loanId, 'schedule'],
    queryFn: async () => {
      const response = await apiClient.get<RepaymentSchedule[]>(`/loans/${loanId}/schedule/`)
      return response.data
    },
    enabled: !!loanId,
  })
}

export function useLoanRepayments(loanId: number) {
  return useQuery({
    queryKey: ['loans', loanId, 'repayments'],
    queryFn: async () => {
      const response = await apiClient.get<Repayment[]>(`/loans/${loanId}/repayments/`)
      return response.data
    },
    enabled: !!loanId,
  })
}
