import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authApi } from '@/api/auth'
import { signupSchema, type SignupFormData } from '@/lib/validators'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Eye, EyeOff, UserPlus, Landmark, MailCheck } from 'lucide-react'

const EMPLOYMENT_OPTIONS = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'RETIRED', label: 'Retired' },
] as const

export function SignupPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
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
      if (message.toLowerCase().includes('nrc')) {
        setError('nrc_number', { message })
      }
      if (message.toLowerCase().includes('email')) {
        setError('email', { message })
      }
    }
  }

  if (successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-sm ring-foreground/10">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MailCheck className="w-6 h-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-xl">Registration received</CardTitle>
              <CardDescription>{successMessage}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/login" className="block">
                <Button className="w-full">Go to sign in</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-2xl">
        <Card className="shadow-sm ring-foreground/10">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm">
                <Landmark className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl tracking-tight">Join UNZALARU</CardTitle>
            <CardDescription>
              Create a member account. Your membership will be pending until an
              administrator approves it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-destructive/10 border border-destructive/25 text-sm text-destructive"
                >
                  {serverError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input id="first_name" placeholder="First name" autoComplete="given-name" {...register('first_name')} />
                  {errors.first_name && (
                    <p className="text-sm text-destructive">{errors.first_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input id="last_name" placeholder="Last name" autoComplete="family-name" {...register('last_name')} />
                  {errors.last_name && (
                    <p className="text-sm text-destructive">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      className="pr-10"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nrc_number">NRC number</Label>
                  <Input id="nrc_number" placeholder="e.g. 123456/78/9" {...register('nrc_number')} />
                  {errors.nrc_number && (
                    <p className="text-sm text-destructive">{errors.nrc_number.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone number</Label>
                  <Input id="phone_number" placeholder="+260..." autoComplete="tel" {...register('phone_number')} />
                  {errors.phone_number && (
                    <p className="text-sm text-destructive">{errors.phone_number.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" placeholder="e.g. Computer Science" {...register('department')} />
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
                    <SelectTrigger className="w-full">
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
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

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline underline-offset-4 font-medium">
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
