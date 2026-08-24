import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useLoan, useLoanSchedule, useLoanRepayments } from '@/hooks/use-loans'
import { useRecordRepayment } from '@/hooks/use-repayments'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, HandCoins } from 'lucide-react'

export function LoanDetail() {
  const { id } = useParams<{ id: string }>()
  const loanId = Number(id)

  const { data: loan, isLoading, error, refetch } = useLoan(loanId)
  const { data: schedule } = useLoanSchedule(loanId)
  const { data: repayments } = useLoanRepayments(loanId)
  const recordRepayment = useRecordRepayment()

  const [showRepaymentForm, setShowRepaymentForm] = useState(false)
  const [repaymentAmount, setRepaymentAmount] = useState('')
  const [repaymentNotes, setRepaymentNotes] = useState('')

  if (isLoading) return <LoadingSkeleton type="detail" />
  if (error) return <ErrorState message="Failed to load loan details" onRetry={() => refetch()} />
  if (!loan) return <ErrorState message="Loan not found" />

  const handleRecordRepayment = async () => {
    const amount = parseFloat(repaymentAmount)
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      await recordRepayment.mutateAsync({
        loan_id: loan.loan_id,
        amount,
        notes: repaymentNotes,
      })
      toast.success('Repayment recorded successfully')
      setShowRepaymentForm(false)
      setRepaymentAmount('')
      setRepaymentNotes('')
      refetch()
    } catch {
      toast.error('Failed to record repayment')
    }
  }

  const completionPercent = loan.total_repayment > 0
    ? Math.round((loan.amount_repaid / loan.total_repayment) * 100)
    : 0

  return (
    <div>
      <PageHeader
        title={`Loan ${loan.loan_id}`}
        description={`${loan.loan_type_name} — ${loan.member?.full_name}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={loan.status} />
            <Link to="/admin/loans">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Principal</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(loan.principal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total Interest</p>
            <p className="text-xl font-bold">{formatCurrency(loan.total_interest)}</p>
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
            <p className="text-xs text-gray-500">Outstanding Balance</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(loan.outstanding_balance)}</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{completionPercent}% repaid</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList>
          <TabsTrigger value="schedule">Repayment Schedule</TabsTrigger>
          <TabsTrigger value="repayments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Repayment Schedule</CardTitle>
              {loan.status === 'ACTIVE' && (
                <Button size="sm" onClick={() => setShowRepaymentForm(!showRepaymentForm)}>
                  <HandCoins className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {showRepaymentForm && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-3">
                  <h4 className="text-sm font-medium">Record Repayment</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Amount (K)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={repaymentAmount}
                        onChange={(e) => setRepaymentAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Input
                        value={repaymentNotes}
                        onChange={(e) => setRepaymentNotes(e.target.value)}
                        placeholder="Payment notes..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleRecordRepayment}
                      disabled={recordRepayment.isPending}
                    >
                      {recordRepayment.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Submit Payment
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowRepaymentForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {!schedule || schedule.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No schedule found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left px-3 py-2 font-medium text-gray-500">#</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Due Date</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Expected</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Paid</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Remaining</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Status</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Overdue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((s) => (
                        <tr key={s.id} className="border-b last:border-b-0">
                          <td className="px-3 py-2">{s.installment_number}</td>
                          <td className="px-3 py-2">{new Date(s.due_date).toLocaleDateString()}</td>
                          <td className="px-3 py-2">{formatCurrency(s.expected_amount)}</td>
                          <td className="px-3 py-2">{formatCurrency(s.amount_paid)}</td>
                          <td className="px-3 py-2 font-medium">{formatCurrency(s.remaining_amount)}</td>
                          <td className="px-3 py-2"><StatusBadge status={s.payment_status} /></td>
                          <td className="px-3 py-2">
                            {s.days_overdue > 0 ? (
                              <span className="text-red-600 font-medium">{s.days_overdue} days</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
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
              <CardTitle>Payment History ({repayments?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {!repayments || repayments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No payments recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Repayment ID</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Installment</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Amount</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Date</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Recorded By</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repayments.map((r) => (
                        <tr key={r.id} className="border-b last:border-b-0">
                          <td className="px-3 py-2 font-medium">{r.repayment_id}</td>
                          <td className="px-3 py-2">#{r.installment_number}</td>
                          <td className="px-3 py-2 font-medium text-emerald-600">{formatCurrency(r.amount)}</td>
                          <td className="px-3 py-2">{formatDateTime(r.payment_date)}</td>
                          <td className="px-3 py-2">{r.recorded_by_name || 'System'}</td>
                          <td className="px-3 py-2 text-gray-500">{r.notes || '—'}</td>
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
