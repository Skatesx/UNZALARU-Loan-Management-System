import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { AdminDashboardSummary, ChartDataPoint, MemberDashboardSummary } from '@/types/dashboard'

export function useAdminDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'admin', 'summary'],
    queryFn: async () => {
      const response = await apiClient.get<AdminDashboardSummary>('/dashboard/admin/summary/')
      return response.data
    },
  })
}

export function useAdminDashboardChart(chartType: string) {
  return useQuery({
    queryKey: ['dashboard', 'admin', 'charts', chartType],
    queryFn: async () => {
      const response = await apiClient.get<ChartDataPoint[]>(`/dashboard/admin/charts/${chartType}/`)
      return response.data
    },
  })
}

export function useMemberDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'member'],
    queryFn: async () => {
      const response = await apiClient.get<MemberDashboardSummary>('/dashboard/member/')
      return response.data
    },
  })
}
