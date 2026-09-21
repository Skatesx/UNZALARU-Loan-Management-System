import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMember, useMemberLoanHistory, useMemberRepaymentHistory, useApproveMember, useRejectMember, useVerifyIncome } from '@/hooks/use-members'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import {
  Mail,
  Phone,
  Building,
  Calendar,
  CreditCard,
  BadgeCheck,
  Clock,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

export function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const memberId = Number(id)

  const { data: member, isLoading, error, refetch } = useMember(memberId)
  const { data: loanHistory } = useMemberLoanHistory(memberId)
  const { data: repaymentHistory } = useMemberRepaymentHistory(memberId)
  const approveMember = useApproveMember()
  const rejectMember = useRejectMember()
  const verifyIncome = useVerifyIncome()

  const [incomeInput, setIncomeInput] = useState('')

  if (isLoading) return <LoadingSkeleton type="detail" />
  if (error) return <ErrorState message="Failed to load member details" onRetry={() => refetch()} />
  if (!member) return <ErrorState message="Member not found" />

  const isPending = member.membership_status === 'PENDING'

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
                      <Mail className="w-4 h-4 text-muted-foreground/70" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground/70" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium">{member.phone_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-muted-foreground/70" />
                      <div>
                        <p className="text-xs text-muted-foreground">Department</p>
                        <p className="text-sm font-medium">{member.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground/70" />
                      <div>
                        <p className="text-xs text-muted-foreground">Registered</p>
                        <p className="text-sm font-medium">
                          {new Date(member.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Address</p>
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
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium">
                      {member.employment_status.replace(/_/g, ' ').toLowerCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Declared Monthly Income</p>
                    <p className="text-sm font-bold text-primary">
                      {formatCurrency(member.monthly_income)}
                    </p>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-1">Income Verification</p>
                    {member.income_verified ? (
                      <p className="text-sm font-medium flex items-center gap-1.5 text-primary">
                        <BadgeCheck className="w-4 h-4" />
                        Verified
                        {member.verified_income != null &&
                          ` — ${formatCurrency(member.verified_income)}`}
                      </p>
                    ) : (
                      <p className="text-sm text-amber-600 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> Not verified
                      </p>
                    )}
                    <div className="mt-2 space-y-2">
                      <Label htmlFor="verified_income" className="text-xs text-muted-foreground">
                        Verified income (K)
                      </Label>
                      <Input
                        id="verified_income"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={String(member.monthly_income ?? '')}
                        value={incomeInput}
                        onChange={(e) => setIncomeInput(e.target.value)}
                      />
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={verifyIncome.isPending || incomeInput === ''}
                        onClick={() =>
                          verifyIncome.mutate(
                            {
                              id: member.id,
                              data: { verified_income: Number(incomeInput) },
                            },
                            {
                              onSuccess: () => {
                                toast.success('Income verified')
                                setIncomeInput('')
                              },
                              onError: () => toast.error('Failed to verify income'),
                            }
                          )
                        }
                      >
                        {verifyIncome.isPending && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Verify income
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Membership</span>
                    <StatusBadge status={member.membership_status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Account</span>
                    <StatusBadge status={member.account_status} />
                  </div>
                  {isPending && (
                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs text-amber-600">
                        This member signed up and is awaiting approval.
                      </p>
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={approveMember.isPending || rejectMember.isPending}
                        onClick={() =>
                          approveMember.mutate(member.id, {
                            onSuccess: () => toast.success('Member approved'),
                            onError: () => toast.error('Failed to approve member'),
                          })
                        }
                      >
                        {approveMember.isPending && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Approve membership
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        disabled={approveMember.isPending || rejectMember.isPending}
                        onClick={() =>
                          rejectMember.mutate(
                            { id: member.id, reason: 'Membership application rejected' },
                            {
                              onSuccess: () => toast.success('Member rejected'),
                              onError: () => toast.error('Failed to reject member'),
                            }
                          )
                        }
                      >
                        Reject membership
                      </Button>
                    </div>
                  )}
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
                <p className="text-sm text-muted-foreground text-center py-8">No loan history found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Loan ID</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Principal</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Repaid</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Outstanding</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanHistory.map((loan) => (
                        <tr key={loan.id} className="border-b last:border-b-0">
                          <td className="px-3 py-2">
                            <Link
                              to={`/admin/loans/${loan.id}`}
                              className="text-primary hover:text-primary/80 font-medium"
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
                <p className="text-sm text-muted-foreground text-center py-8">No repayment history found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Repayment ID</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Loan ID</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repaymentHistory.map((repayment) => (
                        <tr key={repayment.id} className="border-b last:border-b-0">
                          <td className="px-3 py-2 font-medium">{repayment.repayment_id}</td>
                          <td className="px-3 py-2">
                            <Link
                              to={`/admin/loans/${repayment.loan}`}
                              className="text-primary hover:text-primary/80"
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
