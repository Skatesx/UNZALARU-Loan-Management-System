import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { EligibilityRule, EligibilityScore } from '@/types/eligibility'

interface PaginatedResponse<T> {
  count: number
  results: T[]
}

export function useEligibilityRules() {
  return useQuery({
    queryKey: ['eligibility', 'rules'],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<EligibilityRule>>('/eligibility/rules/')
      return response.data.results || response.data
    },
  })
}

export function useUpdateEligibilityRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<EligibilityRule> }) => {
      const response = await apiClient.put(`/eligibility/rules/${id}/`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eligibility', 'rules'] })
    },
  })
}

export function useRecalculateEligibility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (applicationId: string) => {
      const response = await apiClient.post<EligibilityScore>(
        `/eligibility/scores/recalculate/${applicationId}/`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eligibility'] })
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] })
    },
  })
}
