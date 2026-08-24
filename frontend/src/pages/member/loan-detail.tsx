import { useParams, Link } from 'react-router-dom'
import { useLoan, useLoanSchedule, useLoanRepayments } from '@/hooks/use-loans'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { ArrowLeft } from 'lucide-react'

export function LoanDetail() {
  const { id } = useParams<{ id: string }>()
  const loanId = Number(id)

  const { data: loan, isLoading, error } = useLoan(loanId)
  const { data: schedule } = useLoanSchedule(loanId)
  const { data: repayments } = useLoanRepayments(loanId)

  if (isLoading) return <LoadingSkeleton type="detail" />
  if (error) return <ErrorState message="Failed to load loan" />
  if (!loan) return <ErrorState message="Loan not found" />

  const completionPercent = loan.total_repayment > 0
    ? Math.round((loan.amount_repaid / loan.total_repayment) * 100)
    : 0

  return (
    <div>
      <PageHeader
        title={`Loan ${loan.loan_id}`}
        description={loan.loan_type_name}
        actions={
          <Link to="/member/my-loans">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Principal</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(loan.principal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Monthly Installment</p>
            <p className="text-xl font-bold">{formatCurrency(loan.monthly_installment)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Outstanding</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(loan.outstanding_balance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Progress</p>
            <p className="text-xl font-bold">{completionPercent}%</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${completionPercent}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule">
          <Card>
            <CardContent className="p-0">
              {schedule && schedule.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Due Date</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Expected</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Paid</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Remaining</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((s) => (
                      <tr key={s.id} className="border-b last:border-b-0">
                        <td className="px-4 py-3">{s.installment_number}</td>
                        <td className="px-4 py-3">{new Date(s.due_date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{formatCurrency(s.expected_amount)}</td>
                        <td className="px-4 py-3">{formatCurrency(s.amount_paid)}</td>
                        <td className="px-4 py-3 font-medium">{formatCurrency(s.remaining_amount)}</td>
                        <td className="px-4 py-3"><StatusBadge status={s.payment_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No schedule available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payments">
          <Card>
            <CardContent className="p-0">
              {repayments && repayments.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Amount</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Installment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repayments.map((r) => (
                      <tr key={r.id} className="border-b last:border-b-0">
                        <td className="px-4 py-3 font-medium text-emerald-600">{formatCurrency(r.amount)}</td>
                        <td className="px-4 py-3">{formatDateTime(r.payment_date)}</td>
                        <td className="px-4 py-3">#{r.installment_number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No payments recorded yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
