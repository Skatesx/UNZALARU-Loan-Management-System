import { Link } from 'react-router-dom'
import { useLoans } from '@/hooks/use-loans'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { formatCurrency } from '@/lib/formatters'

export function MyLoans() {
  const { data, isLoading, error, refetch } = useLoans({ page_size: 50 })

  if (isLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load loans" onRetry={() => refetch()} />

  const loans = data?.results || []

  return (
    <div>
      <PageHeader title="My Loans" description={`${loans.length} loans`} />

      {loans.length === 0 ? (
        <EmptyState title="No loans" description="You don't have any loans yet." />
      ) : (
        <div className="border rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Loan ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Principal</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Repaid</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Outstanding</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Monthly</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id} className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/member/my-loans/${loan.id}`}
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        {loan.loan_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{loan.loan_type_name}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(loan.principal)}</td>
                    <td className="px-4 py-3">{formatCurrency(loan.amount_repaid)}</td>
                    <td className="px-4 py-3 font-medium text-amber-600">{formatCurrency(loan.outstanding_balance)}</td>
                    <td className="px-4 py-3">{formatCurrency(loan.principal / (loan as any).duration_months || 0)}</td>
                    <td className="px-4 py-3"><StatusBadge status={loan.status} /></td>
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
