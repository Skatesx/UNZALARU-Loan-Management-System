import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type {
  Member,
  MemberListItem,
  MemberCreateRequest,
  MemberUpdateRequest,
  IncomeVerificationRequest,
} from '@/types/member'
import type { Loan } from '@/types/loan'
import type { Repayment } from '@/types/repayment'
import type { EligibilityScore } from '@/types/eligibility'
import type { DefaulterStatus } from '@/types/defaulter'

interface PaginatedResponse<T> {
  count: number
  results: T[]
}

interface MemberListParams {
  page?: number
  page_size?: number
  search?: string
  department?: string
  employment_status?: string
  membership_status?: string
  account_status?: string
  ordering?: string
}

export function useMembers(params: MemberListParams = {}) {
  return useQuery({
    queryKey: ['members', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<MemberListItem>>('/members/', { params })
      return response.data
    },
  })
}

export function useMember(id: number) {
  return useQuery({
    queryKey: ['members', id],
    queryFn: async () => {
      const response = await apiClient.get<Member>(`/members/${id}/`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useMemberLoanHistory(id: number) {
  return useQuery({
    queryKey: ['members', id, 'loan-history'],
    queryFn: async () => {
      const response = await apiClient.get<Loan[]>(`/members/${id}/loan-history/`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useMemberRepaymentHistory(id: number) {
  return useQuery({
    queryKey: ['members', id, 'repayment-history'],
    queryFn: async () => {
      const response = await apiClient.get<Repayment[]>(`/members/${id}/repayment-history/`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useMemberEligibilityHistory(id: number) {
  return useQuery({
    queryKey: ['members', id, 'eligibility-history'],
    queryFn: async () => {
      const response = await apiClient.get<EligibilityScore[]>(`/members/${id}/eligibility-history/`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useMemberDefaulterHistory(id: number) {
  return useQuery({
    queryKey: ['members', id, 'defaulter-history'],
    queryFn: async () => {
      const response = await apiClient.get<DefaulterStatus[]>(`/members/${id}/defaulter-history/`)
      return response.data
    },
    enabled: !!id,
  })
}

export function useCreateMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: MemberCreateRequest) => {
      const response = await apiClient.post('/members/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}

export function useUpdateMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MemberUpdateRequest }) => {
      const response = await apiClient.patch(`/members/${id}/`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['members', variables.id] })
    },
  })
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['members', 'me'],
    queryFn: async () => {
      const response = await apiClient.get<Member>('/members/me/')
      return response.data
    },
  })
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { phone_number?: string; address?: string }) => {
      const response = await apiClient.put('/members/update_me/', data)
      return response.data as Member
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', 'me'] })
    },
  })
}

export function useApproveMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(`/members/${id}/approve/`)
      return response.data as Member
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['members', id] })
    },
  })
}

export function useRejectMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await apiClient.post(`/members/${id}/reject/`, { reason })
      return response.data as Member
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['members', id] })
    },
  })
}

export function useVerifyIncome() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: IncomeVerificationRequest }) => {
      const response = await apiClient.post(`/members/${id}/verify-income/`, data)
      return response.data as Member
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['members', id] })
    },
  })
}
