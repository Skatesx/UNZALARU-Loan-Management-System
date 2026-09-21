import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft, Loader2, MailCheck, KeyRound } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email }: FormData) => {
    // The backend responds identically whether or not the account exists,
    // so always show the neutral confirmation.
    try {
      await authApi.requestPasswordReset(email)
    } catch {
      /* noop — still show the neutral confirmation */
    }
    setSubmitted(true)
  }

  return (
    <AuthShell>
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>
            Enter the email linked to your UNZALARU account and we'll send reset
            instructions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <MailCheck className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-foreground font-medium">Check your inbox</p>
              <p className="text-sm text-muted-foreground mt-1">
                If an account exists with this email, a reset link has been sent.
              </p>
              <Button variant="ghost" className="mt-4" onClick={() => navigate('/login')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to sign in
              </Button>
              {errors.email && <p className="text-sm text-destructive mt-2">{errors.email.message}</p>}
            </div>
      ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@unzalaru.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send reset instructions'
                )}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate('/login')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to sign in
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  )
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
