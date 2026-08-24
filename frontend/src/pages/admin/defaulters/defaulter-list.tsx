import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDefaulters, useUpdateDefaulterStatuses } from '@/hooks/use-defaulters'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { SearchInput } from '@/components/shared/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatRelativeTime } from '@/lib/formatters'
import { toast } from 'sonner'
import { RefreshCw, AlertTriangle, AlertCircle, XCircle } from 'lucide-react'

export function DefaulterList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [classification, setClassification] = useState<string>('')

  const params: Record<string, unknown> = { page, page_size: 20 }
  if (search) params.search = search
  if (classification && classification !== 'ALL') params.classification = classification

  const { data, isLoading, error, refetch } = useDefaulters(params)
  const updateStatuses = useUpdateDefaulterStatuses()

  const handleUpdateStatuses = async () => {
    try {
      const result = await updateStatuses.mutateAsync()
      toast.success(result.message || 'Statuses updated')
      refetch()
    } catch {
      toast.error('Failed to update statuses')
    }
  }

  if (isLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load defaulters" onRetry={() => refetch()} />

  const defaulters = data?.results || []
  const totalCount = data?.count || 0

  // Count by classification
  const counts = {
    AT_RISK: defaulters.filter((d) => d.classification === 'AT_RISK').length,
    DEFAULTER: defaulters.filter((d) => d.classification === 'DEFAULTER').length,
    SEVERE_DEFAULTER: defaulters.filter((d) => d.classification === 'SEVERE_DEFAULTER').length,
  }

  return (
    <div>
      <PageHeader
        title="Defaulters"
        description={`${totalCount} members with overdue payments`}
        actions={
          <Button variant="outline" onClick={handleUpdateStatuses} disabled={updateStatuses.isPending}>
            <RefreshCw className={`w-4 h-4 mr-2 ${updateStatuses.isPending ? 'animate-spin' : ''}`} />
            Update Statuses
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{counts.AT_RISK}</p>
              <p className="text-sm text-orange-600">At Risk</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{counts.DEFAULTER}</p>
              <p className="text-sm text-red-600">Defaulters</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-300 bg-red-100 dark:bg-red-950/30">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-700" />
            <div>
              <p className="text-2xl font-bold">{counts.SEVERE_DEFAULTER}</p>
              <p className="text-sm text-red-700">Severe Defaulters</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="w-64">
          <SearchInput value={search} onChange={setSearch} placeholder="Search defaulters..." />
        </div>
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

      {defaulters.length === 0 ? (
        <EmptyState title="No defaulters found" description="No members with overdue payments." />
      ) : (
        <div className="border rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Member</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Member ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Loan ID</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Days Overdue</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Classification</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Last Checked</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.map((d) => (
                  <tr key={d.id} className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium">{d.member_name}</td>
                    <td className="px-4 py-3">{d.member_id}</td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-600 font-medium">{d.loan_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-red-600">{d.days_overdue}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={d.classification} /></td>
                    <td className="px-4 py-3 text-gray-500">{formatRelativeTime(d.last_checked)}</td>
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
