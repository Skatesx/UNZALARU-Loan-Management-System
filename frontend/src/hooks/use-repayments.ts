import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { Repayment, RepaymentCreateRequest } from '@/types/repayment'

export function useRecordRepayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: RepaymentCreateRequest) => {
      const response = await apiClient.post<Repayment[]>('/repayments/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['repayments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
