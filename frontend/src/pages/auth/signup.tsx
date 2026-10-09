import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authApi } from '@/api/auth'
import { signupSchema, type SignupFormData } from '@/lib/validators'
import { AuthStoryPanel, AuthBrandRow } from '@/components/auth/story-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Eye,
  EyeOff,
  UserPlus,
  MailCheck,
  UserRound,
  BriefcaseBusiness,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react'

const EMPLOYMENT_OPTIONS = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'RETIRED', label: 'Retired' },
] as const

/* Fields validated before leaving each step (keys of SignupFormData). */
const STEP_FIELDS: Array<Array<keyof SignupFormData>> = [
  ['first_name', 'last_name', 'email'],
  ['nrc_number', 'phone_number', 'department', 'employment_status', 'monthly_income', 'address'],
  ['password', 'confirm_password'],
]

const STEPS = [
  { label: 'Your identity', icon: UserRound },
  { label: 'Employee details', icon: BriefcaseBusiness },
  { label: 'Secure account', icon: KeyRound },
]

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${current + 1} of 3`}>
      {STEPS.map(({ label, icon: Icon }, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <span className="w-6 h-px bg-border" aria-hidden />}
            <div
              className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : done
                    ? 'text-primary'
                    : 'text-muted-foreground/60'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center ring-1 transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground ring-primary'
                    : done
                      ? 'bg-primary/15 text-primary ring-primary/40'
                      : 'bg-muted text-muted-foreground ring-border'
                }`}
              >
                {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    trigger,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
    defaultValues: {
      employment_status: 'PERMANENT',
    },
  })

  const employmentStatus = watch('employment_status')

  const extractError = (err: unknown, fallback: string): string => {
    const axiosError = err as {
      response?: { data?: Record<string, unknown> }
    }
    const data = axiosError.response?.data
    if (data) {
      // DRF returns field errors as { field: [messages] }
      for (const [field, messages] of Object.entries(data)) {
        if (Array.isArray(messages) && messages.length > 0) {
          const label = field.replace(/_/g, ' ')
          return `${label.charAt(0).toUpperCase() + label.slice(1)}: ${messages[0]}`
        }
        if (typeof messages === 'string') {
          return messages
        }
      }
    }
    return fallback
  }

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step], { shouldFocus: true })
    if (valid) {
      setServerError(null)
      setStep((s) => Math.min(s + 1, STEPS.length - 1))
    }
  }

  const onSubmit = async (data: SignupFormData) => {
    try {
      setServerError(null)
      const response = await authApi.signup({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
        nrc_number: data.nrc_number,
        phone_number: data.phone_number,
        address: data.address,
        department: data.department,
        employment_status: data.employment_status,
        monthly_income: data.monthly_income,
      })
      setSuccessMessage(
        response.message ||
          'Registration successful. Your account is pending approval by a UNZALARU administrator.'
      )
      setTimeout(() => navigate('/login', { replace: true }), 4000)
    } catch (err: unknown) {
      const message = extractError(err, 'Registration failed. Please check your details and try again.')
      setServerError(message)
      // Jump back to the step owning the offending field.
      if (message.toLowerCase().includes('nrc')) {
        setError('nrc_number', { message })
        setStep(1)
      }
      if (message.toLowerCase().includes('email')) {
        setError('email', { message })
        setStep(0)
      }
    }
  }

  if (successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md animate-rise">
          <Card className="shadow-sm ring-foreground/10">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pop">
                  <MailCheck className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-semibold tracking-tight">Registration received</h2>
              <p className="text-sm text-muted-foreground mt-2">{successMessage}</p>
              <Link to="/login" className="block mt-6">
                <Button className="w-full">Go to sign in</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AuthStoryPanel headline="Start borrowing with your union." />

      <main className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-10 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-[24rem] h-[24rem] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <AuthBrandRow />

        <div className="relative w-full max-w-[30rem] animate-rise">
          <Card className="shadow-lg shadow-foreground/5 ring-foreground/10">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold tracking-tight">Join UNZALARU</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  A few quick steps. Membership stays pending until an administrator approves it.
                </p>
              </div>

              <Stepper current={step} />

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
                {serverError && (
                  <div
                    role="alert"
                    className="animate-pop mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/25 text-sm text-destructive"
                  >
                    {serverError}
                  </div>
                )}

                {/* Step 1 — identity */}
                {step === 0 && (
                  <div className="space-y-4 animate-side-fade" key="s0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First name</Label>
                        <Input id="first_name" className="h-10" placeholder="First name" autoComplete="given-name" {...register('first_name')} />
                        {errors.first_name && (
                          <p className="text-sm text-destructive">{errors.first_name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last name</Label>
                        <Input id="last_name" className="h-10" placeholder="Last name" autoComplete="family-name" {...register('last_name')} />
                        {errors.last_name && (
                          <p className="text-sm text-destructive">{errors.last_name.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" className="h-10" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
                      {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                    </div>
                  </div>
                )}

                {/* Step 2 — employee details */}
                {step === 1 && (
                  <div className="space-y-4 animate-side-fade" key="s1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nrc_number">NRC number</Label>
                        <Input id="nrc_number" className="h-10" placeholder="e.g. 123456/78/9" {...register('nrc_number')} />
                        {errors.nrc_number && (
                          <p className="text-sm text-destructive">{errors.nrc_number.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone_number">Phone number</Label>
                        <Input id="phone_number" className="h-10" placeholder="+260..." autoComplete="tel" {...register('phone_number')} />
                        {errors.phone_number && (
                          <p className="text-sm text-destructive">{errors.phone_number.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input id="department" className="h-10" placeholder="e.g. Computer Science" {...register('department')} />
                        {errors.department && (
                          <p className="text-sm text-destructive">{errors.department.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Employment status</Label>
                        <Select
                          value={employmentStatus}
                          onValueChange={(value) =>
                            setValue('employment_status', value as SignupFormData['employment_status'], {
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger className="w-full h-10">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {EMPLOYMENT_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.employment_status && (
                          <p className="text-sm text-destructive">{errors.employment_status.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monthly_income">Declared monthly income (K)</Label>
                      <Input
                        id="monthly_income"
                        className="h-10"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 8500"
                        {...register('monthly_income')}
                      />
                      {errors.monthly_income && (
                        <p className="text-sm text-destructive">{errors.monthly_income.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        An administrator must verify this before you can borrow.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        rows={2}
                        placeholder="Residential address"
                        {...register('address')}
                      />
                      {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                    </div>
                  </div>
                )}

                {/* Step 3 — password & submit */}
                {step === 2 && (
                  <div className="space-y-4 animate-side-fade" key="s2">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          className="h-10"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="At least 8 characters"
                          autoComplete="new-password"
                          {...register('password')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirm password</Label>
                      <Input
                        id="confirm_password"
                        className="h-10"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        {...register('confirm_password')}
                      />
                      {errors.confirm_password && (
                        <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between gap-3 mt-8">
                  {step > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10"
                      onClick={() => setStep((s) => s - 1)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                  ) : (
                    <span />
                  )}
                  {step < STEPS.length - 1 ? (
                    <Button type="button" className="h-10" onClick={goNext}>
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" className="h-10" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Create account
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <p className="text-sm text-center text-muted-foreground mt-4">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary hover:underline underline-offset-4 font-medium">
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
