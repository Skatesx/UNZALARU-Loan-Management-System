import { useState } from 'react'
import { useAuditLogs } from '@/hooks/use-audit'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { SearchInput } from '@/components/shared/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime } from '@/lib/formatters'

export function AuditLog() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('')

  const params: Record<string, unknown> = { page, page_size: 20 }
  if (search) params.search = search
  if (actionFilter && actionFilter !== 'ALL') params.action = actionFilter

  const { data, isLoading, error, refetch } = useAuditLogs(params)

  if (isLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load audit logs" onRetry={() => refetch()} />

  const logs = data?.results || []
  const totalCount = data?.count || 0

  return (
    <div>
      <PageHeader title="Audit Log" description={`${totalCount} records`} />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="w-64">
          <SearchInput value={search} onChange={setSearch} placeholder="Search logs..." />
        </div>
        <Select value={actionFilter || 'ALL'} onValueChange={(v) => setActionFilter(v || '')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Actions</SelectItem>
            <SelectItem value="APPROVED_LOAN">Approved Loan</SelectItem>
            <SelectItem value="REJECTED_LOAN">Rejected Loan</SelectItem>
            <SelectItem value="RECORDED_REPAYMENT">Recorded Repayment</SelectItem>
            <SelectItem value="CREATED_MEMBER">Created Member</SelectItem>
            <SelectItem value="UPDATED_ELIGIBILITY_RULE">Updated Eligibility Rule</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {logs.length === 0 ? (
        <EmptyState title="No audit logs" description="No audit records found." />
      ) : (
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timestamp</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entity ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(log.timestamp)}</td>
                    <td className="px-4 py-3">{log.user_email || 'System'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted bg-muted">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">{log.entity_type}</td>
                    <td className="px-4 py-3 font-medium">{log.entity_id}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{log.description}</td>
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
