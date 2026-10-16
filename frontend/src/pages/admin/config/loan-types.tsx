import { useEffect, useState } from 'react'
import { useLoanTypes, useUpdateLoanType } from '@/hooks/use-loans'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { LoanType } from '@/types/loan'

/** "10000, 15000, 20000" -> [10000, 15000, 20000] (sorted, positive, unique) */
function parseAmounts(text: string): number[] {
  const values = text
    .split(/[,\s]+/)
    .map((v) => Number(v.replace(/[^0-9.]/g, '')))
    .filter((v) => Number.isFinite(v) && v > 0)
  return [...new Set(values)].sort((a, b) => a - b)
}

/**
 * UNZALARU offers one flat loan - membership is the qualification - so this
 * page edits that single product instead of managing several loan types.
 */
export function LoanTypeConfig() {
  const { data: loanTypes, isLoading, error, refetch } = useLoanTypes()
  const updateLoanType = useUpdateLoanType()

  const types: LoanType[] = Array.isArray(loanTypes) ? loanTypes : []
  const product = types.find((t) => t.is_active)

  const [description, setDescription] = useState('')
  const [rate, setRate] = useState('')
  const [amountsText, setAmountsText] = useState('')
  const [maxMonths, setMaxMonths] = useState('')

  useEffect(() => {
    if (!product) return
    setDescription(product.description)
    setRate(String(Number(product.interest_rate)))
    setAmountsText((product.allowed_amounts || []).map(Number).join(', '))
    setMaxMonths(String(product.max_duration_months))
  }, [product?.id, product?.updated_at])

  if (isLoading) return <LoadingSkeleton type="form" />
  if (error) return <ErrorState message="Failed to load loan settings" onRetry={() => refetch()} />
  if (!product) {
    return <EmptyState title="No active loan product" description="Run the database migrations to create the Flat Loan." />
  }

  const amounts = parseAmounts(amountsText)
  const rateValue = Number(rate)
  const monthsValue = Number(maxMonths)
  const valid =
    amounts.length > 0 &&
    Number.isFinite(rateValue) && rateValue >= 0 && rateValue <= 100 &&
    Number.isInteger(monthsValue) && monthsValue >= 1 && monthsValue <= 60

  const handleSave = async () => {
    try {
      await updateLoanType.mutateAsync({
        id: product.id,
        data: {
          // PUT replaces the record, so send every required field
          name: product.name,
          is_active: true,
          allow_multiple_active: product.allow_multiple_active,
          description,
          interest_rate: rateValue,
          interest_method: 'FLAT_ONCE',
          allowed_amounts: amounts,
          min_amount: amounts[0],
          max_amount: amounts[amounts.length - 1],
          min_duration_months: 1,
          max_duration_months: monthsValue,
        } as Partial<LoanType>,
      })
      toast.success('Loan settings saved')
      refetch()
    } catch {
      toast.error('Failed to save loan settings')
    }
  }

  return (
    <div>
      <PageHeader
        title="Loan Settings"
        description="UNZALARU members qualify by membership for one flat loan"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amounts">Loan amounts (K)</Label>
              <Input
                id="amounts"
                value={amountsText}
                onChange={(e) => setAmountsText(e.target.value)}
                placeholder="10000, 15000, 20000"
              />
              <p className="text-xs text-muted-foreground">
                Members choose one of these amounts. Separate them with commas.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rate">Interest rate (%)</Label>
                <Input id="rate" type="number" step="0.01" min="0" value={rate} onChange={(e) => setRate(e.target.value)} />
                <p className="text-xs text-muted-foreground">Charged once on the amount.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="months">Longest repayment (months)</Label>
                <Input id="months" type="number" min="1" max="60" value={maxMonths} onChange={(e) => setMaxMonths(e.target.value)} />
                <p className="text-xs text-muted-foreground">Members pick 1 up to this.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={!valid || updateLoanType.isPending}>
                {updateLoanType.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What members repay</CardTitle>
          </CardHeader>
          <CardContent>
            {valid ? (
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
                      <td className="py-2">{formatCurrency(a * rateValue / 100)}</td>
                      <td className="py-2 font-medium">{formatCurrency(a * (1 + rateValue / 100))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">Enter valid amounts, a rate and a repayment period to see the totals.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
