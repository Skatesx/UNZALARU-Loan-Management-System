import { useState } from 'react'
import { useLoanTypes, useCreateLoanType, useUpdateLoanType } from '@/hooks/use-loans'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/formatters'
import { toast } from 'sonner'
import { Loader2, Pencil, Plus } from 'lucide-react'
import type { LoanType } from '@/types/loan'

/** "10000, 15000, 20000" -> [10000, 15000, 20000] (sorted, positive, unique) */
function parseAmounts(text: string): number[] {
  const values = text
    .split(/[,\s]+/)
    .map((v) => Number(v.replace(/[^0-9.]/g, '')))
    .filter((v) => Number.isFinite(v) && v > 0)
  return [...new Set(values)].sort((a, b) => a - b)
}

interface FormState {
  name: string
  description: string
  amounts: string
  rate: string
  maxMonths: string
  isActive: boolean
}

const EMPTY_FORM: FormState = { name: '', description: '', amounts: '', rate: '10', maxMonths: '12', isActive: true }

function apiError(err: unknown, fallback: string) {
  const data = (err as { response?: { data?: Record<string, unknown> } }).response?.data
  if (!data) return fallback
  if (typeof data.error === 'string') return data.error
  const first = Object.values(data)[0]
  return Array.isArray(first) ? String(first[0]) : fallback
}

/** What members repay for each amount: interest is charged once on the amount. */
function RepaymentTable({ amounts, rate }: { amounts: number[]; rate: number }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
          <th className="py-2">Amount</th>
          <th className="py-2">Interest</th>
          <th className="py-2">Total to repay</th>
        </tr>
      </thead>
      <tbody>
        {amounts.map((a) => (
          <tr key={a} className="border-b last:border-b-0">
            <td className="py-2 font-medium">{formatCurrency(a)}</td>
            <td className="py-2">{formatCurrency(a * rate / 100)}</td>
            <td className="py-2 font-medium">{formatCurrency(a * (1 + rate / 100))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * Loan types members can apply for. Each is a fixed-amount loan with
 * interest charged once. Types are switched off rather than deleted, because
 * existing loans refer to them. With one active type, members are not asked
 * to choose.
 */
export function LoanTypeConfig() {
  const { data: loanTypes, isLoading, error, refetch } = useLoanTypes()
  const createLoanType = useCreateLoanType()
  const updateLoanType = useUpdateLoanType()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LoanType | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const types: LoanType[] = Array.isArray(loanTypes) ? loanTypes : []
  const activeCount = types.filter((t) => t.is_active).length

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (t: LoanType) => {
    setEditing(t)
    setForm({
      name: t.name,
      description: t.description,
      amounts: (t.allowed_amounts || []).map(Number).join(', '),
      rate: String(Number(t.interest_rate)),
      maxMonths: String(t.max_duration_months),
      isActive: t.is_active,
    })
    setDialogOpen(true)
  }

  const amounts = parseAmounts(form.amounts)
  const rate = Number(form.rate)
  const months = Number(form.maxMonths)
  const valid =
    form.name.trim().length > 0 &&
    amounts.length > 0 &&
    Number.isFinite(rate) && rate >= 0 && rate <= 100 &&
    Number.isInteger(months) && months >= 1 && months <= 60
  const saving = createLoanType.isPending || updateLoanType.isPending

  const handleSave = async () => {
    const data: Partial<LoanType> = {
      name: form.name.trim(),
      description: form.description,
      allowed_amounts: amounts,
      interest_rate: rate,
      interest_method: 'FLAT_ONCE',
      min_duration_months: 1,
      max_duration_months: months,
      is_active: form.isActive,
    }
    try {
      if (editing) {
        await updateLoanType.mutateAsync({ id: editing.id, data })
        toast.success(`${data.name} saved`)
      } else {
        await createLoanType.mutateAsync(data)
        toast.success(`${data.name} added`)
      }
      setDialogOpen(false)
      refetch()
    } catch (err) {
      toast.error(apiError(err, 'Failed to save the loan type'))
    }
  }

  const toggleActive = async (t: LoanType, active: boolean) => {
    try {
      await updateLoanType.mutateAsync({ id: t.id, data: { is_active: active } })
      toast.success(`${t.name} ${active ? 'switched on' : 'switched off'}`)
    } catch (err) {
      toast.error(apiError(err, 'Failed to update the loan type'))
    }
  }

  if (isLoading) return <LoadingSkeleton type="form" />
  if (error) return <ErrorState message="Failed to load loan types" onRetry={() => refetch()} />

  return (
    <div>
      <PageHeader
        title="Loan Settings"
        description={
          activeCount === 1
            ? 'Members apply for the one active loan type without having to choose'
            : `${activeCount} active loan types: members choose one when applying`
        }
        actions={
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" /> Add loan type
          </Button>
        }
      />

      {activeCount === 0 && types.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
          No loan type is switched on, so members cannot apply for loans.
        </div>
      )}

      {types.length === 0 ? (
        <EmptyState title="No loan types yet" description="Add a loan type so members can apply." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {types.map((t) => {
            const typeAmounts = (t.allowed_amounts || []).map(Number)
            return (
              <Card key={t.id} className={t.is_active ? '' : 'opacity-70'}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2">
                      {t.name}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        t.is_active
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {t.is_active ? 'Active' : 'Off'}
                      </span>
                    </CardTitle>
                    {t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch
                        checked={t.is_active}
                        disabled={updateLoanType.isPending}
                        onCheckedChange={(v) => toggleActive(t, v)}
                        aria-label={`${t.name} active`}
                      />
                      Active
                    </label>
                    <Button variant="outline" size="sm" onClick={() => openEdit(t)} aria-label={`Edit ${t.name}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {Number(t.interest_rate)}% interest charged once, repaid over 1 to {t.max_duration_months} months
                  </p>
                  {typeAmounts.length > 0 ? (
                    <RepaymentTable amounts={typeAmounts} rate={Number(t.interest_rate)} />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Any amount from {formatCurrency(Number(t.min_amount))} to {formatCurrency(Number(t.max_amount))}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'Add loan type'}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (valid) handleSave()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="lt-name">Name</Label>
              <Input id="lt-name" value={form.name} placeholder="e.g. Emergency Loan" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lt-amounts">Loan amounts (K)</Label>
              <Input id="lt-amounts" value={form.amounts} placeholder="e.g. 5000, 10000" onChange={(e) => setForm({ ...form, amounts: e.target.value })} />
              <p className="text-xs text-muted-foreground">Members choose one of these amounts. Separate them with commas.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="lt-rate">Interest rate (%)</Label>
                <Input id="lt-rate" type="number" step="0.01" min="0" max="100" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
                <p className="text-xs text-muted-foreground">Charged once on the amount.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lt-months">Longest repayment (months)</Label>
                <Input id="lt-months" type="number" min="1" max="60" value={form.maxMonths} onChange={(e) => setForm({ ...form, maxMonths: e.target.value })} />
                <p className="text-xs text-muted-foreground">Members pick 1 up to this.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lt-description">Description</Label>
              <Textarea id="lt-description" value={form.description} placeholder="Shown to members when they choose a loan type" onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              Active (members can apply for it)
            </label>
            {valid && (
              <div className="rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">What members repay</p>
                <RepaymentTable amounts={amounts} rate={rate} />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!valid || saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? 'Save' : 'Add loan type'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
