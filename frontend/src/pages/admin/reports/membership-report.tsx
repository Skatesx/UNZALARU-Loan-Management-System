import { useState } from 'react'
import { useMembershipReport, downloadReport } from '@/hooks/use-reports'
import { useSchools } from '@/hooks/use-members'
import { PageHeader } from '@/components/shared/page-header'
import { ReportTabs } from '@/components/reports/report-tabs'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileText } from 'lucide-react'
import { toast } from 'sonner'

const ALL = 'ALL'
const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Current members (active)' },
  { value: 'PENDING', label: 'Pending approval' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: ALL, label: 'All statuses' },
]

const th = 'text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground'

function CountTable({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">No members</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-t">
                  <td className="px-6 py-2">{row.label}</td>
                  <td className="px-6 py-2 text-right font-medium tabular-nums">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}

export function MembershipReport() {
  // Default to current (active) members; staff narrow by school/department
  const [status, setStatus] = useState<string>('ACTIVE')
  const [school, setSchool] = useState<string>(ALL)
  const [department, setDepartment] = useState<string>(ALL)

  const { data: schools } = useSchools()

  const params: Record<string, string> = {}
  if (status !== ALL) params.status = status
  if (school !== ALL) params.school = school
  if (department !== ALL) params.department = department

  const { data, isLoading, error, refetch } = useMembershipReport(params)

  const departmentOptions = (schools || [])
    .filter((s) => school === ALL || s.school === school)
    .flatMap((s) => s.departments)
    .sort()

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      await downloadReport('membership', format, params)
      toast.success(`Membership report downloaded as ${format.toUpperCase()}`)
    } catch {
      toast.error('Failed to download report')
    }
  }

  if (isLoading && !data) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load membership report" onRetry={() => refetch()} />
  if (!data) return null

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? ''

  return (
    <div>
      <ReportTabs />
      <PageHeader
        title="Membership Report"
        description={`${data.total} member${data.total === 1 ? '' : 's'}`}
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
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6">
        <div className="space-y-1">
          <Label className="text-xs">Membership</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v || ALL)}
            items={Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]))}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">School</Label>
          <Select
            value={school}
            items={{ [ALL]: 'All schools' }}
            onValueChange={(v) => {
              setSchool(v || ALL)
              setDepartment(ALL) // departments depend on the school
            }}
          >
            <SelectTrigger className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All schools</SelectItem>
              {(schools || []).map((s) => (
                <SelectItem key={s.school} value={s.school}>{s.school}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Department</Label>
          <Select
            value={department}
            onValueChange={(v) => setDepartment(v || ALL)}
            items={{ [ALL]: 'All departments' }}
          >
            <SelectTrigger className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All departments</SelectItem>
              {departmentOptions.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <CountTable
          title="By membership status"
          rows={data.by_status.map((r) => ({ label: r.status.charAt(0) + r.status.slice(1).toLowerCase(), count: r.count }))}
        />
        <CountTable
          title="By school"
          rows={data.by_school.map((r) => ({ label: r.school, count: r.count }))}
        />
        <CountTable
          title="By department"
          rows={data.by_department.map((r) => ({ label: r.department, count: r.count }))}
        />
      </div>

      {data.members.length === 0 ? (
        <EmptyState title="No members" description={`No ${statusLabel.toLowerCase()} match the selected filters.`} />
      ) : (
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className={th}>MAN Number</th>
                  <th className={th}>Member</th>
                  <th className={th}>School</th>
                  <th className={th}>Department</th>
                  <th className={th}>Membership</th>
                  <th className={th}>Times Applied</th>
                  <th className={th}>Registered</th>
                </tr>
              </thead>
              <tbody>
                {data.members.map((m) => (
                  <tr key={m.member_id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">{m.member_id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{m.member_name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </td>
                    <td className="px-4 py-3">{m.school}</td>
                    <td className="px-4 py-3">{m.department}</td>
                    <td className="px-4 py-3"><StatusBadge status={m.membership_status} /></td>
                    <td className="px-4 py-3 tabular-nums">{m.application_count}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.registered}</td>
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
