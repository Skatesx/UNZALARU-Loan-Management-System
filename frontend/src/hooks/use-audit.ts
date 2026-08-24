import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { AuditLog } from '@/types/audit'

interface PaginatedResponse {
  count: number
  results: AuditLog[]
}

interface AuditParams {
  action?: string
  entity_type?: string
  search?: string
  page?: number
  page_size?: number
  ordering?: string
}

export function useAuditLogs(params: AuditParams = {}) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse>('/audit/', { params })
      return response.data
    },
  })
}
