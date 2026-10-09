import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLoans } from '@/hooks/use-loans'
import { useStaffBase } from '@/hooks/use-auth'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { SearchInput } from '@/components/shared/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/formatters'

export function LoanList() {
  const staffBase = useStaffBase()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const params: Record<string, unknown> = { page, page_size: 20 }
  if (search) params.search = search
  if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter

  const { data, isLoading, error, refetch } = useLoans(params)

  if (isLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load loans" onRetry={() => refetch()} />

  const loans = data?.results || []
  const totalCount = (data as any)?.count || 0
  const totalPages = Math.ceil(totalCount / 20)

  return (
    <div>
      <PageHeader title="Loans" description={`${totalCount} total loans`} />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="w-64">
          <SearchInput value={search} onChange={setSearch} placeholder="Search loans..." />
        </div>
        <Select value={statusFilter || 'ALL'} onValueChange={(v) => setStatusFilter(v || '')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="DEFAULTED">Defaulted</SelectItem>
            <SelectItem value="WRITTEN_OFF">Written Off</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loans.length === 0 ? (
        <EmptyState title="No loans found" description="No loans match your criteria." />
      ) : (
        <>
          <div className="border rounded-lg bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loan ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Member</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Principal</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Repaid</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr
                      key={loan.id}
                      className="border-b last:border-b-0 hover:bg-muted/50 "
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`${staffBase}/loans/${loan.id}`}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          {loan.loan_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{loan.member_name}</p>
                          <p className="text-xs text-muted-foreground">{loan.member_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{loan.loan_type_name}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(loan.principal)}</td>
                      <td className="px-4 py-3">{formatCurrency(loan.amount_repaid)}</td>
                      <td className="px-4 py-3 font-medium text-amber-600">
                        {formatCurrency(loan.outstanding_balance)}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={loan.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(loan.date_approved).toLocaleDateString()}
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
