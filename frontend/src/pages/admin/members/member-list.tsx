import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMembers, useApproveMember, useRejectMember } from '@/hooks/use-members'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { SearchInput } from '@/components/shared/search-input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/formatters'
import { BadgeCheck, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth, useStaffBase } from '@/hooks/use-auth'

export function MemberList() {
  const { isAdmin } = useAuth()
  const staffBase = useStaffBase()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [employmentFilter, setEmploymentFilter] = useState('')
  const approveMember = useApproveMember()
  const rejectMember = useRejectMember()

  const params: Record<string, unknown> = { page, page_size: 20 }
  if (search) params.search = search
  if (statusFilter && statusFilter !== 'ALL') params.membership_status = statusFilter
  if (employmentFilter && employmentFilter !== 'ALL') params.employment_status = employmentFilter

  const { data, isLoading, error, refetch } = useMembers(params)

  if (isLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load members" onRetry={() => refetch()} />

  const members = data?.results || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / 20)

  return (
    <div>
      <PageHeader
        title="Members"
        description={`${totalCount} total members`}
        actions={
          isAdmin ? (
            <Link to="/admin/members/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="w-64">
          <SearchInput value={search} onChange={setSearch} placeholder="Search members..." />
        </div>
        <Select value={statusFilter || 'ALL'} onValueChange={(v) => setStatusFilter(v || '')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={employmentFilter || 'ALL'} onValueChange={(v) => setEmploymentFilter(v || '')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Employment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Employment</SelectItem>
            <SelectItem value="PERMANENT">Permanent</SelectItem>
            <SelectItem value="CONTRACT">Contract</SelectItem>
            <SelectItem value="PART_TIME">Part Time</SelectItem>
            <SelectItem value="RETIRED">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {members.length === 0 ? (
        <EmptyState title="No members found" description="No members match your search criteria." />
      ) : (
        <>
          <div className="border rounded-lg bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Member ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Income</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Income Verified</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b last:border-b-0 hover:bg-muted/50  cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`${staffBase}/members/${member.id}`}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          {member.member_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium">{member.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                      <td className="px-4 py-3">{member.department}</td>
                      <td className="px-4 py-3">{formatCurrency(member.monthly_income)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={member.membership_status} />
                      </td>
                      <td className="px-4 py-3">
                        {member.income_verified ? (
                          <span className="inline-flex items-center gap-1 text-primary text-sm">
                            <BadgeCheck className="w-4 h-4" /> Yes
                          </span>
                        ) : (
                          <span className="text-muted-foreground/70 text-sm">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isAdmin && member.membership_status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              disabled={approveMember.isPending || rejectMember.isPending}
                              onClick={() =>
                                approveMember.mutate(member.id, {
                                  onSuccess: () => toast.success(`${member.full_name} approved`),
                                  onError: () => toast.error('Failed to approve member'),
                                })
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={approveMember.isPending || rejectMember.isPending}
                              onClick={() =>
                                rejectMember.mutate(
                                  { id: member.id, reason: 'Rejected from members list' },
                                  {
                                    onSuccess: () => toast.success(`${member.full_name} rejected`),
                                    onError: () => toast.error('Failed to reject member'),
                                  }
                                )
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        )}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
