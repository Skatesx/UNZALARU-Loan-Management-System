import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/use-auth'
import { loginSchema, type LoginFormData } from '@/lib/validators'
import { AuthStoryPanel, AuthBrandRow } from '@/components/auth/story-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null)
      const user = await login(data.email, data.password)
      const home =
        user.role === 'ADMIN'
          ? '/admin/dashboard'
          : user.role === 'SUPERVISOR'
            ? '/supervisor/dashboard'
            : '/member/dashboard'
      navigate(home, { replace: true })
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string; error?: string } } }
      setError(
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.error ||
        'Invalid email or password'
      )
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AuthStoryPanel />

      <main className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-10 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-[24rem] h-[24rem] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <AuthBrandRow />

        <div className="relative w-full max-w-[26rem] animate-rise">
          <Card className="shadow-lg shadow-foreground/5 ring-foreground/10">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Sign in to continue to your dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div
                    role="alert"
                    className="animate-pop p-3 rounded-lg bg-destructive/10 border border-destructive/25 text-sm text-destructive"
                  >
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@unzalaru.com"
                    className="h-10"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-primary hover:underline underline-offset-4"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="h-10 pr-10"
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

                <Button type="submit" className="w-full h-10 mt-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <p className="text-sm text-center text-muted-foreground pt-1">
                  New to UNZALARU?{' '}
                  <Link
                    to="/signup"
                    className="text-primary hover:underline underline-offset-4 font-medium"
                  >
                    Create a member account
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-[11px] text-muted-foreground/60 mt-6">
            UNZALARU Employees' Loan Management System
          </p>
        </div>
      </main>
    </div>
  )
}
