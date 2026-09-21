import { Link } from 'react-router-dom'
import { useLoanApplications } from '@/hooks/use-loans'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { formatCurrency } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { HandCoins } from 'lucide-react'

export function MyApplications() {
  const { data, isLoading, error, refetch } = useLoanApplications({ page_size: 50 })

  if (isLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load applications" onRetry={() => refetch()} />

  const applications = data?.results || []

  return (
    <div>
      <PageHeader
        title="My Applications"
        description={`${applications.length} applications`}
        actions={
          <Link to="/member/apply-loan">
            <Button>
              <HandCoins className="w-4 h-4 mr-2" />
              Apply for Loan
            </Button>
          </Link>
        }
      />

      {applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="You haven't applied for any loans yet."
          action={
            <Link to="/member/apply-loan">
              <Button>Apply for a Loan</Button>
            </Link>
          }
        />
      ) : (
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Application ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loan Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Applied</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b last:border-b-0 hover:bg-muted/50 ">
                    <td className="px-4 py-3 font-medium">{app.application_id}</td>
                    <td className="px-4 py-3">{app.loan_type_name}</td>
                    <td className="px-4 py-3">{formatCurrency(app.requested_amount)}</td>
                    <td className="px-4 py-3">{app.duration_months} months</td>
                    <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(app.application_date).toLocaleDateString()}
                    </td>
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
