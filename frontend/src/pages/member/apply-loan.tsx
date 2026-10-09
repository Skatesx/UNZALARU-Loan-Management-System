import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLoanTypes, useCreateLoanApplication } from '@/hooks/use-loans'
import { loanApplicationSchema, type LoanApplicationFormData } from '@/lib/validators'
import { PendingFeatureGate } from '@/components/shared/pending-member-banner'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { formatCurrency } from '@/lib/formatters'
import { toast } from 'sonner'
import { Loader2, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'

export function ApplyLoan() {
  const navigate = useNavigate()
  const { data: loanTypes, isLoading: loadingTypes } = useLoanTypes()
  const createApplication = useCreateLoanApplication()
  const [step, setStep] = useState(1)
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)

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
      loan_type: 0,
      requested_amount: 0,
      duration_months: 1,
      purpose: '',
    },
  })

  const amount = watch('requested_amount')
  const duration = watch('duration_months')
  const purpose = watch('purpose')
  const selectedType = Array.isArray(loanTypes) ? loanTypes.find((t: any) => t.id === selectedTypeId) : null

  // Validation failures must never be silent: show a toast naming the problem
  // and jump back to the step where the user can fix it. (Step 3 renders no
  // inputs, so without this a failed submit looked like a dead button.)
  const onInvalid = (errs: Record<string, { message?: string }>) => {
    const order: Array<[keyof LoanApplicationFormData, number]> = [
      ['loan_type', 1],
      ['requested_amount', 2],
      ['duration_months', 2],
      ['purpose', 2],
    ]
    const first = order.find(([key]) => errs[key])
    toast.error(
      first?.[0] && errs[first[0]]?.message
        ? errs[first[0]].message!
        : 'Please complete all fields before submitting',
      { duration: 8000 }
    )
    if (first) setStep(first[1])
  }

  const estimatedMonthly = selectedType && amount && duration
    ? (amount * (1 + Number(selectedType.interest_rate) / 100 * duration / 12)) / duration
    : 0

  const onSubmit = async (data: LoanApplicationFormData) => {
    if (!selectedTypeId) {
      toast.error('Please select a loan type')
      return
    }
    try {
      await createApplication.mutateAsync({ ...data, loan_type: selectedTypeId })
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

  const types = Array.isArray(loanTypes) ? loanTypes : []

  return (
    <PendingFeatureGate feature="Loan applications">
      <div>
      <PageHeader title="Apply for Loan" description="Complete the loan application form" />

      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {step > s ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            {s < 3 && <div className={`w-16 h-0.5 ${step > s ? 'bg-emerald-600' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        {/* Step 1: Select Loan Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-center mb-6">Select Loan Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {types.map((lt: any) => (
                <Card
                  key={lt.id}
                  className={`cursor-pointer transition-all ${
                    selectedTypeId === lt.id
                      ? 'ring-2 ring-emerald-500 border-emerald-500'
                      : 'hover:border-input'
                  }`}
                  onClick={() => {
                    setSelectedTypeId(lt.id)
                    // Keep React Hook Form state in sync — the hidden-input
                    // approach left the form value at 0 and silently blocked
                    // final submission.
                    setValue('loan_type', lt.id, { shouldValidate: false })
                  }}
                >
                  <CardContent className="p-5">
                    <h3 className="font-semibold">{lt.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{lt.description}</p>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground/70">Amount</p>
                        <p className="font-medium">K{Number(lt.min_amount).toLocaleString()} — K{Number(lt.max_amount).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground/70">Interest</p>
                        <p className="font-medium">{lt.interest_rate}% ({lt.interest_method})</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground/70">Duration</p>
                        <p className="font-medium">{lt.min_duration_months}—{lt.max_duration_months} months</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Loan Details */}
        {step === 2 && (
          <div className="max-w-lg mx-auto space-y-4">
            <h2 className="text-lg font-medium text-center mb-6">Loan Details</h2>
            <div className="space-y-2">
              <Label>Requested Amount (K)</Label>
              <Input type="number" step="0.01" {...register('requested_amount')} />
              {errors.requested_amount && <p className="text-sm text-destructive">{errors.requested_amount.message}</p>}
              {selectedType && (
                <p className="text-xs text-muted-foreground/70">
                  Range: K{Number(selectedType.min_amount).toLocaleString()} — K{Number(selectedType.max_amount).toLocaleString()}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Duration (months)</Label>
              <Input type="number" {...register('duration_months')} />
              {errors.duration_months && <p className="text-sm text-destructive">{errors.duration_months.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Textarea {...register('purpose')} placeholder="Describe the purpose of this loan..." rows={4} />
              {errors.purpose && <p className="text-sm text-destructive">{errors.purpose.message}</p>}
            </div>

            {/* Preview */}
            {amount > 0 && duration > 0 && (
              <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Estimated Repayment</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Installment</p>
                      <p className="font-bold">{formatCurrency(estimatedMonthly)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Repayment</p>
                      <p className="font-bold">{formatCurrency(estimatedMonthly * duration)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="max-w-lg mx-auto space-y-4">
            <h2 className="text-lg font-medium text-center mb-6">Review & Submit</h2>
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loan Type</span>
                  <span className="font-medium">{selectedType?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{formatCurrency(amount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{duration} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Monthly</span>
                  <span className="font-bold text-primary">{formatCurrency(estimatedMonthly)}</span>
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
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
          )}
          {step < 3 ? (
            <Button
              type="button"
              onClick={() => {
                if (step === 1 && !selectedTypeId) {
                  toast.error('Please select a loan type')
                  return
                }
                if (step === 2 && selectedType) {
                  // Validate loan-type limits before advancing so users see
                  // inline errors instead of a backend rejection later.
                  const amt = Number(amount)
                  const dur = Number(duration)
                  if (!amt || amt <= 0) {
                    setError('requested_amount', { message: 'Amount must be positive' })
                    return
                  }
                  if (amt < Number(selectedType.min_amount) || amt > Number(selectedType.max_amount)) {
                    setError('requested_amount', {
                      message: `Amount must be between K${Number(selectedType.min_amount).toLocaleString()} and K${Number(selectedType.max_amount).toLocaleString()}`,
                    })
                    return
                  }
                  if (!dur || dur < 1) {
                    setError('duration_months', { message: 'Duration must be at least 1 month' })
                    return
                  }
                  if (dur < selectedType.min_duration_months || dur > selectedType.max_duration_months) {
                    setError('duration_months', {
                      message: `Duration must be between ${selectedType.min_duration_months} and ${selectedType.max_duration_months} months`,
                    })
                    return
                  }
                  if (!purpose || purpose.trim().length < 10) {
                    setError('purpose', {
                      message: 'Please describe the purpose (at least 10 characters)',
                    })
                    return
                  }
                  clearErrors('requested_amount')
                  clearErrors('duration_months')
                  clearErrors('purpose')
                }
                setStep(step + 1)
              }}
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" disabled={createApplication.isPending}>
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
