import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLoanTypes, useCreateLoanApplication } from '@/hooks/use-loans'
import { loanApplicationSchema, type LoanApplicationFormData } from '@/lib/validators'
import type { LoanType } from '@/types/loan'
import { PendingFeatureGate } from '@/components/shared/pending-member-banner'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { formatCurrency } from '@/lib/formatters'
import { toast } from 'sonner'
import { Loader2, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'

/** Total to repay for the loan product, matching the backend calculation. */
function totalRepayment(product: LoanType, amount: number, months: number) {
  const rate = Number(product.interest_rate) / 100
  if (product.interest_method === 'FLAT_ONCE') return amount * (1 + rate)
  return amount * (1 + rate * months / 12)
}

export function ApplyLoan() {
  const navigate = useNavigate()
  const { data: loanTypes, isLoading: loadingTypes } = useLoanTypes()
  const createApplication = useCreateLoanApplication()
  // Steps: 0 = choose a loan type (only when several are active), 1 = details, 2 = review
  const [step, setStep] = useState(1)
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)

  // Members only see active loan types; with just one, they aren't asked to choose
  const types: LoanType[] = Array.isArray(loanTypes) ? loanTypes : []
  const chooseType = types.length > 1
  const product: LoanType | undefined = chooseType
    ? types.find((t) => t.id === selectedTypeId)
    : types[0]
  const stage = chooseType && (step === 0 || !product) ? 0 : step

  // Start on the choose-a-type step once we know there is a choice to make
  useEffect(() => {
    if (chooseType && selectedTypeId === null) setStep(0)
  }, [chooseType, selectedTypeId])
  const stageNumbers = chooseType ? [0, 1, 2] : [1, 2]
  const amounts = product?.allowed_amounts?.length
    ? product.allowed_amounts.map(Number)
    : []
  const monthOptions = product
    ? Array.from(
        { length: product.max_duration_months - product.min_duration_months + 1 },
        (_, i) => product.min_duration_months + i
      )
    : []

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoanApplicationFormData>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      requested_amount: 0,
      duration_months: 0,
      purpose: '',
    },
  })

  const amount = Number(watch('requested_amount')) || 0
  const duration = Number(watch('duration_months')) || 0
  const purpose = watch('purpose')

  const total = product && amount && duration ? totalRepayment(product, amount, duration) : 0
  const monthly = total && duration ? total / duration : 0

  // Validation failures must never be silent: say what's wrong and go back
  // to the details step (the review step has no inputs).
  const onInvalid = (errs: Record<string, { message?: string }>) => {
    const first = (['requested_amount', 'duration_months', 'purpose'] as const).find((k) => errs[k])
    toast.error(
      (first && errs[first]?.message) || 'Please complete all fields before submitting',
      { duration: 8000 }
    )
    setStep(1)
  }

  const pickType = (t: LoanType) => {
    if (t.id !== selectedTypeId) {
      // Amounts and periods differ between types, so start those again
      setValue('requested_amount', 0)
      setValue('duration_months', 0)
    }
    setSelectedTypeId(t.id)
  }

  const goToReview = () => {
    let valid = true
    if (!amount) {
      setError('requested_amount', { message: 'Choose how much you want to borrow' })
      valid = false
    }
    if (!duration) {
      setError('duration_months', { message: 'Choose a repayment period' })
      valid = false
    }
    if (!purpose || purpose.trim().length < 10) {
      setError('purpose', { message: 'Please describe the purpose (at least 10 characters)' })
      valid = false
    }
    if (valid) {
      clearErrors()
      setStep(2)
    }
  }

  const onSubmit = async (data: LoanApplicationFormData) => {
    try {
      await createApplication.mutateAsync({
        requested_amount: Number(data.requested_amount),
        duration_months: Number(data.duration_months),
        purpose: data.purpose,
        loan_type: product?.id,
      })
      toast.success('Loan application submitted!')
      navigate('/member/my-applications')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      toast.error(
        axiosError.response?.data?.error ||
        'Failed to submit application. Please check your details and try again.',
        { duration: 8000 }
      )
    }
  }

  if (loadingTypes) return <LoadingSkeleton type="form" />

  if (types.length === 0) {
    return (
      <EmptyState
        title="Loans are not available right now"
        description="Please check back later or contact a UNZALARU administrator."
      />
    )
  }

  return (
    <PendingFeatureGate feature="Loan applications">
      <div>
      <PageHeader
        title="Apply for Loan"
        description={
          product && stage > 0
            ? `${product.name}: ${Number(product.interest_rate)}% interest${
                product.interest_method === 'FLAT_ONCE' ? ', charged once' : ''
              }`
            : 'Choose the loan that suits you'
        }
      />

      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8">
        {stageNumbers.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              stage >= s ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {stage > s ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            {i < stageNumbers.length - 1 && <div className={`w-16 h-0.5 ${stage > s ? 'bg-emerald-600' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        {/* Step 0: choose a loan type (only when several are active) */}
        {stage === 0 && (
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-lg font-medium text-center mb-6">Choose a loan type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Loan type">
              {types.map((t) => {
                const list = (t.allowed_amounts || []).map(Number)
                const selected = t.id === selectedTypeId
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => pickType(t)}
                    className={`text-left rounded-xl border p-5 transition-all ${
                      selected
                        ? 'border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                        : 'hover:border-input bg-card'
                    }`}
                  >
                    <p className="font-semibold">{t.name}</p>
                    {t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}
                    <p className="text-sm mt-3">
                      <span className="font-medium">
                        {list.length
                          ? list.map((a) => formatCurrency(a)).join(' / ')
                          : `${formatCurrency(Number(t.min_amount))} to ${formatCurrency(Number(t.max_amount))}`}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Number(t.interest_rate)}% interest{t.interest_method === 'FLAT_ONCE' ? ' charged once' : ''},
                      repaid over 1 to {t.max_duration_months} months
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 1: Loan details */}
        {stage === 1 && product && (
          <div className="max-w-lg mx-auto space-y-5">
            <h2 className="text-lg font-medium text-center mb-6">Loan Details</h2>

            <div className="space-y-2">
              <Label>How much do you want to borrow?</Label>
              <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Loan amount">
                {amounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={amount === value}
                    onClick={() => {
                      setValue('requested_amount', value)
                      clearErrors('requested_amount')
                    }}
                    className={`rounded-lg border px-3 py-4 text-center font-semibold transition-all ${
                      amount === value
                        ? 'border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                        : 'hover:border-input bg-card'
                    }`}
                  >
                    {formatCurrency(value)}
                  </button>
                ))}
              </div>
              {errors.requested_amount && <p className="text-sm text-destructive">{errors.requested_amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Repayment period</Label>
              <Select
                value={duration ? String(duration) : ''}
                items={Object.fromEntries(monthOptions.map((m) => [String(m), `${m} month${m === 1 ? '' : 's'}`]))}
                onValueChange={(v) => {
                  setValue('duration_months', Number(v))
                  clearErrors('duration_months')
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose number of months" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} month{m === 1 ? '' : 's'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.duration_months && <p className="text-sm text-destructive">{errors.duration_months.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Purpose</Label>
              <Textarea {...register('purpose')} placeholder="Describe the purpose of this loan..." rows={4} />
              {errors.purpose && <p className="text-sm text-destructive">{errors.purpose.message}</p>}
            </div>

            {/* Preview */}
            {total > 0 && (
              <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Estimated Repayment</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Interest</p>
                      <p className="font-bold">{formatCurrency(total - amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Repayment</p>
                      <p className="font-bold">{formatCurrency(total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly</p>
                      <p className="font-bold">{formatCurrency(monthly)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: Review & Submit */}
        {stage === 2 && product && (
          <div className="max-w-lg mx-auto space-y-4">
            <h2 className="text-lg font-medium text-center mb-6">Review & Submit</h2>
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loan</span>
                  <span className="font-medium">{product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Repayment period</span>
                  <span className="font-medium">{duration} month{duration === 1 ? '' : 's'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest ({Number(product.interest_rate)}%)</span>
                  <span className="font-medium">{formatCurrency(total - amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total to repay</span>
                  <span className="font-medium">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Monthly</span>
                  <span className="font-bold text-primary">{formatCurrency(monthly)}</span>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-1">Purpose</p>
                  <p className="text-sm">{purpose || '—'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-center gap-3 mt-8">
          {(stage === 2 || (stage === 1 && chooseType)) && (
            <Button type="button" variant="outline" onClick={() => setStep(stage - 1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
          )}
          {/* Distinct keys stop React reusing the Next button as the Submit
              button, which would turn the click on Next into a form submit */}
          {stage === 0 ? (
            <Button
              key="choose"
              type="button"
              onClick={() => (product ? setStep(1) : toast.error('Choose a loan type'))}
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : stage === 1 ? (
            <Button key="next" type="button" onClick={goToReview}>
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button key="submit" type="submit" disabled={createApplication.isPending}>
              {createApplication.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                'Submit Application'
              )}
            </Button>
          )}
        </div>
      </form>
      </div>
    </PendingFeatureGate>
  )
}
