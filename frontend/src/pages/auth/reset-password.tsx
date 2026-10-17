import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, KeyRound, Loader2 } from 'lucide-react'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

type FormData = z.infer<typeof schema>

/** Opened from the emailed link: /reset-password?uid=...&token=... */
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const uid = params.get('uid') ?? ''
  const token = params.get('token') ?? ''
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ password }: FormData) => {
    try {
      setServerError(null)
      await authApi.confirmPasswordReset(uid, token, password)
      setDone(true)
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } }).response?.data
      const fieldError = Array.isArray(data?.new_password) ? String(data.new_password[0]) : null
      setServerError(
        (typeof data?.error === 'string' && data.error) || fieldError ||
        'Could not reset your password. Request a new link and try again.'
      )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl">Choose a new password</CardTitle>
            <CardDescription>For your UNZALARU Loans account.</CardDescription>
          </CardHeader>
          <CardContent>
            {!uid || !token ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  This link is incomplete. Open the link from your email again, or request a new one.
                </p>
                <Button variant="outline" onClick={() => navigate('/forgot-password')}>Request a new link</Button>
              </div>
            ) : done ? (
              <div className="text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
                <p className="text-sm font-medium">Your password has been reset</p>
                <Button onClick={() => navigate('/login', { replace: true })}>Sign in</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {serverError && (
                  <div role="alert" className="p-3 rounded-lg bg-destructive/10 border border-destructive/25 text-sm text-destructive">
                    {serverError}{' '}
                    {serverError.includes('expired') && (
                      <Link to="/forgot-password" className="underline">Request a new link</Link>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <Input id="confirm" type="password" autoComplete="new-password" {...register('confirm')} />
                  {errors.confirm && <p className="text-sm text-destructive">{errors.confirm.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Reset password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
