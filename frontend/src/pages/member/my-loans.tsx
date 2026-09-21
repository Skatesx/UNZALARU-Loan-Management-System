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
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loan ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Principal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Repaid</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id} className="border-b last:border-b-0 hover:bg-muted/50 ">
                    <td className="px-4 py-3">
                      <Link
                        to={`/member/my-loans/${loan.id}`}
                        className="text-primary hover:text-primary/80 font-medium"
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
