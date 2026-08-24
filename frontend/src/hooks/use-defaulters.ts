import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { DefaulterStatusListItem } from '@/types/defaulter'

interface PaginatedResponse {
  count: number
  results: DefaulterStatusListItem[]
}

interface DefaulterParams {
  classification?: string
  search?: string
  page?: number
  page_size?: number
}

export function useDefaulters(params: DefaulterParams = {}) {
  return useQuery({
    queryKey: ['defaulters', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse>('/defaulters/', { params })
      return response.data
    },
  })
}

export function useUpdateDefaulterStatuses() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/defaulters/update_statuses/')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defaulters'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
