import { useState } from 'react'
import { useLoanReport, downloadReport } from '@/hooks/use-reports'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/formatters'
import { Download, FileText } from 'lucide-react'
import { toast } from 'sonner'

export function LoanReport() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const params: Record<string, unknown> = {}
  if (dateFrom) params.date_from = dateFrom
  if (dateTo) params.date_to = dateTo
  if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter

  const { data, isLoading, error, refetch } = useLoanReport(params)

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      await downloadReport('loans', format)
      toast.success(`Loan report downloaded as ${format.toUpperCase()}`)
    } catch {
      toast.error('Failed to download report')
    }
  }

  if (isLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load loan report" onRetry={() => refetch()} />

  const loans = data || []

  return (
    <div>
      <PageHeader
        title="Loan Report"
        description={`${loans.length} loans`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="space-y-1">
          <Label className="text-xs">Date From</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date To</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter || 'ALL'} onValueChange={(v) => setStatusFilter(v || '')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="DEFAULTED">Defaulted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loans.length === 0 ? (
        <EmptyState title="No loan data" description="No loans match the selected filters." />
      ) : (
        <div className="border rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Loan ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Member</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Interest</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Total Repayment</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Duration</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date Approved</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan: any, idx: number) => (
                  <tr key={idx} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">{loan.loan_id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{loan.member_name}</p>
                        <p className="text-xs text-gray-500">{loan.member_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(loan.amount)}</td>
                    <td className="px-4 py-3">{formatCurrency(loan.interest)}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(loan.total_repayment)}</td>
                    <td className="px-4 py-3">{loan.duration} months</td>
                    <td className="px-4 py-3"><StatusBadge status={loan.status} /></td>
                    <td className="px-4 py-3 text-gray-500">
                      {loan.date_approved ? new Date(loan.date_approved).toLocaleDateString() : '—'}
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
