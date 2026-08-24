import { useState } from 'react'
import { apiClient } from '@/api/client'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { SearchInput } from '@/components/shared/search-input'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { useQuery } from '@tanstack/react-query'

interface RepaymentRecord {
  id: number
  repayment_id: string
  loan_id: string
  installment_number: number
  amount: number
  payment_date: string
  recorded_by_name: string | null
  notes: string
}

interface PaginatedResponse {
  count: number
  results: RepaymentRecord[]
}

export function RepaymentList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const params: Record<string, unknown> = { page, page_size: 20 }
  if (search) params.search = search

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['repayments', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse>('/repayments/', { params })
      return response.data
    },
  })

  if (isLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load repayments" onRetry={() => refetch()} />

  const repayments = data?.results || []
  const totalCount = data?.count || 0

  return (
    <div>
      <PageHeader title="Repayments" description={`${totalCount} total repayments`} />

      <div className="mb-6">
        <div className="w-64">
          <SearchInput value={search} onChange={setSearch} placeholder="Search repayments..." />
        </div>
      </div>

      {repayments.length === 0 ? (
        <EmptyState title="No repayments found" description="No repayments match your criteria." />
      ) : (
        <div className="border rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Repayment ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Loan ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Installment</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Recorded By</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Notes</th>
                </tr>
              </thead>
              <tbody>
                {repayments.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium">{r.repayment_id}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">{r.loan_id}</td>
                    <td className="px-4 py-3">#{r.installment_number}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(r.amount)}</td>
                    <td className="px-4 py-3">{formatDateTime(r.payment_date)}</td>
                    <td className="px-4 py-3">{r.recorded_by_name || 'System'}</td>
                    <td className="px-4 py-3 text-gray-500">{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
