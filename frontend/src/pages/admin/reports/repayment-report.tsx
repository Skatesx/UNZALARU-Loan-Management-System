import { useState } from 'react'
import { useRepaymentReport, downloadReport } from '@/hooks/use-reports'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { Download, FileText } from 'lucide-react'
import { toast } from 'sonner'

export function RepaymentReport() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const params: Record<string, unknown> = {}
  if (dateFrom) params.date_from = dateFrom
  if (dateTo) params.date_to = dateTo

  const { data, isLoading, error, refetch } = useRepaymentReport(params)

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      await downloadReport('repayments', format)
      toast.success(`Repayment report downloaded as ${format.toUpperCase()}`)
    } catch {
      toast.error('Failed to download report')
    }
  }

  if (isLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load repayment report" onRetry={() => refetch()} />

  const repayments = data || []

  return (
    <div>
      <PageHeader
        title="Repayment Report"
        description={`${repayments.length} repayments`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-2" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <FileText className="w-4 h-4 mr-2" /> PDF
            </Button>
          </div>
        }
      />

      <div className="flex gap-3 mb-6">
        <div className="space-y-1">
          <Label className="text-xs">Date From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date To</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {repayments.length === 0 ? (
        <EmptyState title="No data" description="No repayments match the selected filters." />
      ) : (
        <div className="border rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Member</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Loan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Expected</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Actual</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Outstanding</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {repayments.map((r: any, idx: number) => (
                  <tr key={idx} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{r.member_name}</p>
                        <p className="text-xs text-gray-500">{r.member_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{r.loan_id}</td>
                    <td className="px-4 py-3">{formatCurrency(r.expected_payment)}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(r.actual_payment)}</td>
                    <td className="px-4 py-3">{formatDateTime(r.payment_date)}</td>
                    <td className="px-4 py-3">{formatCurrency(r.outstanding_balance)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
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
