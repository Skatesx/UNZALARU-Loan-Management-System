import { useState } from 'react'
import { useDefaulterReport } from '@/hooks/use-reports'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/formatters'

export function DefaulterReport() {
  const [classification, setClassification] = useState<string>('')

  const params: Record<string, unknown> = {}
  if (classification && classification !== 'ALL') params.classification = classification

  const { data, isLoading, error, refetch } = useDefaulterReport(params)

  if (isLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load defaulter report" onRetry={() => refetch()} />

  const report = data || []

  return (
    <div>
      <PageHeader title="Defaulter Report" description={`${report.length} records`} />

      <div className="mb-6">
        <Select value={classification || 'ALL'} onValueChange={(v) => setClassification(v || '')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Classifications" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Classifications</SelectItem>
            <SelectItem value="AT_RISK">At Risk</SelectItem>
            <SelectItem value="DEFAULTER">Defaulter</SelectItem>
            <SelectItem value="SEVERE_DEFAULTER">Severe Defaulter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {report.length === 0 ? (
        <EmptyState title="No data" description="No defaulter records found." />
      ) : (
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Member</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loan ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount Overdue</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Days Overdue</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Classification</th>
                </tr>
              </thead>
              <tbody>
                {report.map((r: any, idx: number) => (
                  <tr key={idx} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{r.member_name}</p>
                        <p className="text-xs text-muted-foreground">{r.member_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{r.loan_id}</td>
                    <td className="px-4 py-3">{formatCurrency(r.amount_overdue)}</td>
                    <td className="px-4 py-3 font-bold text-red-600">{r.days_overdue} days</td>
                    <td className="px-4 py-3"><StatusBadge status={r.classification} /></td>
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
