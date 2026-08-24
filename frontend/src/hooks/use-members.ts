import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { Member, MemberListItem, MemberCreateRequest, MemberUpdateRequest } from '@/types/member'
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
