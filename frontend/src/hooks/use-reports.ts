import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

interface ReportParams {
  member_id?: string
  status?: string
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

export async function downloadReport(type: 'loans' | 'repayments', format: 'csv' | 'pdf') {
  const response = await apiClient.get(`/reports/${type}/export/${format}/`, {
    responseType: 'blob',
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
