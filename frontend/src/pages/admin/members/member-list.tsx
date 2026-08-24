import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMembers } from '@/hooks/use-members'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { SearchInput } from '@/components/shared/search-input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/formatters'
import { Plus } from 'lucide-react'

export function MemberList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [employmentFilter, setEmploymentFilter] = useState('')

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
          <Link to="/admin/members/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </Link>
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
          <div className="border rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Member ID</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Department</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Income</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/members/${member.id}`}
                          className="text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          {member.member_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium">{member.full_name}</td>
                      <td className="px-4 py-3 text-gray-500">{member.email}</td>
                      <td className="px-4 py-3">{member.department}</td>
                      <td className="px-4 py-3">{formatCurrency(member.monthly_income)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={member.membership_status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(member.date_joined).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
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
