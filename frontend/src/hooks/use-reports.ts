import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

interface ReportParams {
  member_id?: string
  status?: string
  school?: string
  department?: string
  classification?: string
  date_from?: string
  date_to?: string
}

export function useLoanReport(params: ReportParams = {}) {
  return useQuery({
    queryKey: ['reports', 'loans', params],
    queryFn: async () => {
      const response = await apiClient.get('/reports/loans/', { params })
      return response.data
    },
  })
}

export function useRepaymentReport(params: ReportParams = {}) {
  return useQuery({
    queryKey: ['reports', 'repayments', params],
    queryFn: async () => {
      const response = await apiClient.get('/reports/repayments/', { params })
      return response.data
    },
  })
}

export function useDefaulterReport(params: ReportParams = {}) {
  return useQuery({
    queryKey: ['reports', 'defaulters', params],
    queryFn: async () => {
      const response = await apiClient.get('/reports/defaulters/', { params })
      return response.data
    },
  })
}

export function useEligibilityReport(params: ReportParams = {}) {
  return useQuery({
    queryKey: ['reports', 'eligibility', params],
    queryFn: async () => {
      const response = await apiClient.get('/reports/eligibility/', { params })
      return response.data
    },
  })
}

export interface MembershipReport {
  total: number
  by_status: { status: string; count: number }[]
  by_school: { school: string; count: number }[]
  by_department: { department: string; count: number }[]
  members: {
    member_id: string
    member_name: string
    email: string
    school: string
    department: string
    employment_status: string
    membership_status: string
    application_count: number
    registered: string
  }[]
}

export function useMembershipReport(params: ReportParams = {}) {
  return useQuery({
    queryKey: ['reports', 'membership', params],
    queryFn: async () => {
      const response = await apiClient.get<MembershipReport>('/reports/membership/', { params })
      return response.data
    },
    // Keep showing the last results while a new filter loads
    placeholderData: (previous) => previous,
  })
}

export function useExportReport(type: 'loans' | 'repayments', format: 'csv' | 'pdf') {
  return useQuery({
    queryKey: ['reports', 'export', type, format],
    queryFn: async () => {
      const response = await apiClient.get(`/reports/${type}/export/${format}/`, {
        responseType: 'blob',
      })
      return response.data
    },
    enabled: false, // Only run when triggered manually
  })
}

export async function downloadReport(
  type: 'loans' | 'repayments' | 'membership',
  format: 'csv' | 'pdf',
  params: ReportParams = {},
) {
  const response = await apiClient.get(`/reports/${type}/export/${format}/`, {
    responseType: 'blob',
    params,
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${type}_report.${format}`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
