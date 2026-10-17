import { useEffect, useMemo, useRef, useState } from 'react'
import {
  usePayrollMonth,
  useMatchPayrollReturn,
  useConfirmPayroll,
  downloadPayrollFile,
  type DeductionMatch,
  type PayrollReturnMatch,
} from '@/hooks/use-payroll'
import { useAuth } from '@/hooks/use-auth'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { toast } from 'sonner'
import { CheckCircle2, Download, FileText, FileSpreadsheet, Upload, Loader2 } from 'lucide-react'

const th = 'text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground'

const MATCH_LABEL: Record<DeductionMatch, { label: string; className: string }> = {
  FULL: { label: 'Deducted', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25' },
  PARTIAL: { label: 'Partly deducted', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25' },
  NOT_DEDUCTED: { label: 'Not deducted', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/25' },
  OVER: { label: 'More than due', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25' },
}

function MatchBadge({ match }: { match: DeductionMatch }) {
  const { label, className } = MATCH_LABEL[match]
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>{label}</span>
}

function matchFor(due: number, deducted: number): DeductionMatch {
  if (deducted <= 0) return 'NOT_DEDUCTED'
  return deducted < due ? 'PARTIAL' : 'FULL'
}

function thisMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

/**
 * Monthly salary deductions: UNZALARU sends payroll this list (installment
 * due plus arrears per MAN number), then confirms what payroll deducted -
 * from payroll's return or by ticking the list - which records the repayments.
 */
export function PayrollDeductions() {
  const { isAdmin } = useAuth()
  const [month, setMonth] = useState(thisMonth())
  const { data, isLoading, error, refetch } = usePayrollMonth(month)
  const matchReturn = useMatchPayrollReturn()
  const confirmPayroll = useConfirmPayroll()

  // Amount payroll deducted per loan (editable until the month is confirmed)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [returnMatch, setReturnMatch] = useState<PayrollReturnMatch | null>(null)
  const [bankAmount, setBankAmount] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  // Start each month assuming everything due was deducted
  useEffect(() => {
    if (!data || data.confirmed) return
    setAmounts(Object.fromEntries(data.rows.map((r) => [r.loan_id, r.amount_due])))
    setReturnMatch(null)
    setBankAmount('')
  }, [data?.month, data?.confirmed])

  const rows = data?.rows ?? []
  const editable = Boolean(isAdmin && data && !data.confirmed)
  const isFuture = month > thisMonth()

  const deductedTotal = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(amounts[r.loan_id]) || 0), 0),
    [rows, amounts]
  )
  const invalidRows = rows.filter((r) => {
    const value = Number(amounts[r.loan_id])
    return !Number.isFinite(value) || value < 0 || value > Number(r.amount_due)
  })
  const notDeducted = rows.filter((r) => !(Number(amounts[r.loan_id]) > 0)).length
  const bankDiff = bankAmount !== '' ? Number(bankAmount) - deductedTotal : null

  const download = async (format: 'csv' | 'pdf' | 'template') => {
    try {
      await downloadPayrollFile(month, format)
    } catch {
      toast.error('Failed to download the file')
    }
  }

  const handleUpload = async (file: File | undefined) => {
    if (!file) return
    try {
      const result = await matchReturn.mutateAsync({ month, file })
      setReturnMatch(result)
      setAmounts(Object.fromEntries(result.rows.map((r) => [r.loan_id, r.amount_deducted ?? '0'])))
      const issues = result.rows.filter((r) => r.match !== 'FULL').length + result.unknown.length
      toast.success(
        issues
          ? `Payroll return read. ${issues} line${issues === 1 ? '' : 's'} need${issues === 1 ? 's' : ''} attention.`
          : 'Payroll return read. Everything was deducted in full.'
      )
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      toast.error(e.response?.data?.error || 'Could not read the payroll return')
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const handleConfirm = async () => {
    setConfirmOpen(false)
    try {
      await confirmPayroll.mutateAsync({
        month,
        deductions: rows.map((r) => ({ loan_id: r.loan_id, amount_deducted: amounts[r.loan_id] || '0' })),
        bank_amount: bankAmount || undefined,
      })
      toast.success(`${monthLabel(month)} deductions confirmed and recorded as repayments`)
      refetch()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      toast.error(e.response?.data?.error || 'Failed to confirm deductions')
    }
  }

  return (
    <div>
      <PageHeader
        title="Payroll Deductions"
        description="Loans are repaid through salary deductions: send payroll this list, then confirm what was deducted"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => download('csv')} disabled={!rows.length}>
              <Download className="w-4 h-4 mr-2" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => download('pdf')} disabled={!rows.length}>
              <FileText className="w-4 h-4 mr-2" /> PDF
            </Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-6">
        <div className="space-y-1">
          <Label htmlFor="month" className="text-xs">Payroll month</Label>
          <Input
            id="month"
            type="month"
            className="w-48"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
        </div>
      </div>

      {isLoading && <LoadingSkeleton type="table" />}
      {error && <ErrorState message="Failed to load the deduction list" onRetry={() => refetch()} />}

      {data && (
        <>
          {data.confirmed && data.run && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-500/25 dark:bg-emerald-500/10">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-medium">
                  {monthLabel(month)} deductions were confirmed
                  {data.run.confirmed_by && ` by ${data.run.confirmed_by}`} on {formatDateTime(data.run.confirmed_at)}.
                </p>
                <p className="text-muted-foreground">
                  {formatCurrency(Number(data.run.total_deducted))} deducted of {formatCurrency(Number(data.run.total_due))} due
                  {data.run.bank_amount && `; ${formatCurrency(Number(data.run.bank_amount))} received in the bank`}.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Stat label="Members to deduct" value={String(data.totals.members)} />
            <Stat label="This month's installments" value={formatCurrency(Number(data.totals.current_due))} />
            <Stat label="Arrears" value={formatCurrency(Number(data.totals.arrears))} />
            <Stat label="Total to deduct" value={formatCurrency(Number(data.totals.amount_due))} />
          </div>

          {editable && rows.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium">After payroll has run</p>
                <p className="text-sm text-muted-foreground">
                  Upload payroll's return (a CSV with a MAN number column and an amount deducted column),
                  or adjust the amounts in the list below. Untick anyone payroll did not deduct.
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInput}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files?.[0])}
                  />
                  <Button size="sm" onClick={() => fileInput.current?.click()} disabled={matchReturn.isPending}>
                    {matchReturn.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload payroll return
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => download('template')}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Download return template
                  </Button>
                </div>
                {returnMatch && returnMatch.unknown.length > 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-500/25 dark:bg-amber-500/10">
                    <p className="font-medium">Not on this month's list ({returnMatch.unknown.length})</p>
                    <p className="text-muted-foreground">
                      {returnMatch.unknown.map((u) => `${u.member_id} (${formatCurrency(Number(u.amount))})`).join(', ')}
                      {' '}- check these MAN numbers with payroll; they will not be recorded.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {rows.length === 0 ? (
            <EmptyState
              title="Nothing to deduct"
              description={`No active loans have installments or arrears due in ${monthLabel(month)}.`}
            />
          ) : (
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {editable && <th className={th}>Deducted</th>}
                      <th className={th}>MAN Number</th>
                      <th className={th}>Member</th>
                      <th className={th}>This Month</th>
                      <th className={th}>Arrears</th>
                      <th className={th}>Total Due</th>
                      {(editable || data.confirmed) && <th className={th}>Amount Deducted</th>}
                      {(editable || data.confirmed) && <th className={th}>Status</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const due = Number(r.amount_due)
                      const value = data.confirmed ? r.amount_deducted ?? '0' : amounts[r.loan_id] ?? ''
                      const deducted = Number(value) || 0
                      const match = data.confirmed
                        ? r.match ?? matchFor(due, deducted)
                        : returnMatch?.rows.find((m) => m.loan_id === r.loan_id && m.match === 'OVER')
                          ? 'OVER'
                          : matchFor(due, deducted)
                      const invalid = invalidRows.includes(r)
                      return (
                        <tr key={r.loan_id} className="border-b last:border-b-0">
                          {editable && (
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                aria-label={`Deducted from ${r.member_name}`}
                                className="h-4 w-4 accent-emerald-600"
                                checked={deducted > 0}
                                onChange={(e) =>
                                  setAmounts({ ...amounts, [r.loan_id]: e.target.checked ? r.amount_due : '0' })
                                }
                              />
                            </td>
                          )}
                          <td className="px-4 py-3 font-medium">{r.member_id}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{r.member_name}</p>
                            <p className="text-xs text-muted-foreground">{[r.department, r.school].filter(Boolean).join(', ')}</p>
                          </td>
                          <td className="px-4 py-3 tabular-nums">{formatCurrency(Number(r.current_due))}</td>
                          <td className="px-4 py-3 tabular-nums">{Number(r.arrears) > 0 ? formatCurrency(Number(r.arrears)) : '-'}</td>
                          <td className="px-4 py-3 font-medium tabular-nums">{formatCurrency(due)}</td>
                          {editable && (
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max={r.amount_due}
                                aria-label={`Amount deducted from ${r.member_name}`}
                                aria-invalid={invalid}
                                className="w-32"
                                value={value}
                                onChange={(e) => setAmounts({ ...amounts, [r.loan_id]: e.target.value })}
                              />
                              {invalid && <p className="text-xs text-destructive mt-1">0 to {formatCurrency(due)}</p>}
                            </td>
                          )}
                          {data.confirmed && <td className="px-4 py-3 tabular-nums">{formatCurrency(deducted)}</td>}
                          {(editable || data.confirmed) && <td className="px-4 py-3"><MatchBadge match={match} /></td>}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {editable && rows.length > 0 && (
            <Card className="mt-6">
              <CardContent className="p-4 flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total deducted</p>
                    <p className="text-lg font-bold tabular-nums">{formatCurrency(deductedTotal)}</p>
                    <p className="text-xs text-muted-foreground">
                      of {formatCurrency(Number(data.totals.amount_due))} due
                      {notDeducted > 0 && `; ${notDeducted} not deducted`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="bank" className="text-xs">Received in the bank (optional)</Label>
                    <Input
                      id="bank"
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-44"
                      placeholder="Amount payroll remitted"
                      value={bankAmount}
                      onChange={(e) => setBankAmount(e.target.value)}
                    />
                    {bankDiff !== null && Math.abs(bankDiff) >= 0.005 && (
                      <p className="text-xs text-amber-600">
                        {bankDiff > 0 ? 'More' : 'Less'} than the total deducted by {formatCurrency(Math.abs(bankDiff))}
                      </p>
                    )}
                    {bankDiff !== null && Math.abs(bankDiff) < 0.005 && (
                      <p className="text-xs text-emerald-600">Matches the total deducted</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Button
                    onClick={() => setConfirmOpen(true)}
                    disabled={confirmPayroll.isPending || invalidRows.length > 0 || isFuture}
                  >
                    {confirmPayroll.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Confirm {monthLabel(month)} deductions
                  </Button>
                  {isFuture && <p className="text-xs text-muted-foreground">Future months can be confirmed once payroll has run.</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {monthLabel(month)} deductions?</AlertDialogTitle>
            <AlertDialogDescription>
              {formatCurrency(deductedTotal)} will be recorded as salary-deduction repayments
              {notDeducted > 0 && (notDeducted === 1
                ? ', and the 1 member who wasn\'t deducted will stay in arrears'
                : `, and the ${notDeducted} members who weren't deducted will stay in arrears`)}.
              A month can only be confirmed once.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
