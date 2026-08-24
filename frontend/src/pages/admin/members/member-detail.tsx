import { useParams, Link } from 'react-router-dom'
import { useMember, useMemberLoanHistory, useMemberRepaymentHistory } from '@/hooks/use-members'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { Mail, Phone, Building, Calendar, CreditCard } from 'lucide-react'

export function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const memberId = Number(id)

  const { data: member, isLoading, error, refetch } = useMember(memberId)
  const { data: loanHistory } = useMemberLoanHistory(memberId)
  const { data: repaymentHistory } = useMemberRepaymentHistory(memberId)

  if (isLoading) return <LoadingSkeleton type="detail" />
  if (error) return <ErrorState message="Failed to load member details" onRetry={() => refetch()} />
  if (!member) return <ErrorState message="Member not found" />

  return (
    <div>
      <PageHeader
        title={member.full_name}
        description={`Member ID: ${member.member_id}`}
        actions={
          <StatusBadge status={member.membership_status} />
        }
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="loans">Loan History</TabsTrigger>
          <TabsTrigger value="repayments">Repayment History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium">{member.phone_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Department</p>
                        <p className="text-sm font-medium">{member.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Date Joined</p>
                        <p className="text-sm font-medium">
                          {new Date(member.date_joined).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Address</p>
                    <p className="text-sm">{member.address}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Employment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-sm font-medium">{member.employment_status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Monthly Income</p>
                    <p className="text-sm font-bold text-emerald-600">
                      {formatCurrency(member.monthly_income)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Membership</span>
                    <StatusBadge status={member.membership_status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Account</span>
                    <StatusBadge status={member.account_status} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="loans">
          <Card>
            <CardHeader>
              <CardTitle>Loan History ({loanHistory?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {!loanHistory || loanHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No loan history found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Loan ID</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Type</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Principal</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Repaid</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Outstanding</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanHistory.map((loan) => (
                        <tr key={loan.id} className="border-b last:border-b-0">
                          <td className="px-3 py-2">
                            <Link
                              to={`/admin/loans/${loan.id}`}
                              className="text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              {loan.loan_id}
                            </Link>
                          </td>
                          <td className="px-3 py-2">{loan.loan_type_name}</td>
                          <td className="px-3 py-2">{formatCurrency(loan.principal)}</td>
                          <td className="px-3 py-2">{formatCurrency(loan.amount_repaid)}</td>
                          <td className="px-3 py-2">{formatCurrency(loan.outstanding_balance)}</td>
                          <td className="px-3 py-2"><StatusBadge status={loan.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repayments">
          <Card>
            <CardHeader>
              <CardTitle>Repayment History ({repaymentHistory?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {!repaymentHistory || repaymentHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No repayment history found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Repayment ID</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Loan ID</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Amount</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Date</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repaymentHistory.map((repayment) => (
                        <tr key={repayment.id} className="border-b last:border-b-0">
                          <td className="px-3 py-2 font-medium">{repayment.repayment_id}</td>
                          <td className="px-3 py-2">
                            <Link
                              to={`/admin/loans/${repayment.loan}`}
                              className="text-emerald-600 hover:text-emerald-700"
                            >
                              {repayment.loan_id}
                            </Link>
                          </td>
                          <td className="px-3 py-2 font-medium">{formatCurrency(repayment.amount)}</td>
                          <td className="px-3 py-2">{formatDateTime(repayment.payment_date)}</td>
                          <td className="px-3 py-2">{repayment.recorded_by_name || 'System'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
