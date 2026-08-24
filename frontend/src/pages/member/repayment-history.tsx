import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import type { Repayment } from '@/types/repayment'

export function RepaymentHistory() {
  const { data: repayments, isLoading, error, refetch } = useQuery({
    queryKey: ['member', 'repayment-history'],
    queryFn: async () => {
      const response = await apiClient.get<Repayment[]>('/loans/')
      // Fetch repayments from all member loans
      const loans = (response.data as any).results || response.data
      const allRepayments: Repayment[] = []
      for (const loan of (Array.isArray(loans) ? loans : [])) {
        try {
          const repayResponse = await apiClient.get<Repayment[]>(`/loans/${loan.id}/repayments/`)
          allRepayments.push(...((repayResponse.data as any).results || repayResponse.data))
        } catch {
          // Skip failed fetches
        }
      }
      return allRepayments.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
    },
  })

  if (isLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load repayment history" onRetry={() => refetch()} />

  const totalPaid = repayments?.reduce((sum, r) => sum + r.amount, 0) || 0

  return (
    <div>
      <PageHeader
        title="Repayment History"
        description={`${repayments?.length || 0} payments — Total paid: ${formatCurrency(totalPaid)}`}
      />

      {!repayments || repayments.length === 0 ? (
        <EmptyState title="No payments" description="No repayment records found." />
      ) : (
        <div className="border rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Loan ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Installment</th>
                </tr>
              </thead>
              <tbody>
                {repayments.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium text-emerald-600">{r.loan_id}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(r.amount)}</td>
                    <td className="px-4 py-3">{formatDateTime(r.payment_date)}</td>
                    <td className="px-4 py-3">#{r.installment_number}</td>
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
