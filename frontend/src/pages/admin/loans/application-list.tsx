import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLoanApplications } from '@/hooks/use-loans'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { SearchInput } from '@/components/shared/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/formatters'

export function ApplicationList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const params: Record<string, unknown> = { page, page_size: 20 }
  if (search) params.search = search
  if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter

  const { data, isLoading, error, refetch } = useLoanApplications(params)

  if (isLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load applications" onRetry={() => refetch()} />

  const applications = data?.results || []
  const totalCount = (data as any)?.count || 0
  const totalPages = Math.ceil(totalCount / 20)

  return (
    <div>
      <PageHeader
        title="Loan Applications"
        description={`${totalCount} total applications`}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="w-64">
          <SearchInput value={search} onChange={setSearch} placeholder="Search applications..." />
        </div>
        <Select value={statusFilter || 'ALL'} onValueChange={(v) => setStatusFilter(v || '')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {applications.length === 0 ? (
        <EmptyState title="No applications found" description="No loan applications match your criteria." />
      ) : (
        <>
          <div className="border rounded-lg bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Application ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Member</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loan Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      className="border-b last:border-b-0 hover:bg-muted/50 "
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/loans/applications/${app.id}`}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          {app.application_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{app.member_name}</p>
                          <p className="text-xs text-muted-foreground">{app.member_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{app.loan_type_name}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(app.requested_amount)}</td>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, totalCount)} of {totalCount}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
