import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authApi } from '@/api/auth'
import { passwordChangeSchema, type PasswordChangeFormData } from '@/lib/validators'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Any signed-in user changes their own password (e.g. after a temporary one). */
export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeFormData>({ resolver: zodResolver(passwordChangeSchema) })

  const close = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const onSubmit = async (data: PasswordChangeFormData) => {
    try {
      await authApi.changePassword({ old_password: data.old_password, new_password: data.new_password })
      toast.success('Password changed')
      close(false)
    } catch (err: unknown) {
      const body = (err as { response?: { data?: Record<string, string[]> } }).response?.data
      if (body?.old_password) setError('old_password', { message: body.old_password[0] })
      else if (body?.new_password) setError('new_password', { message: body.new_password[0] })
      else toast.error('Could not change your password')
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="old_password">Current password</Label>
            <Input id="old_password" type="password" autoComplete="current-password" {...register('old_password')} />
            {errors.old_password && <p className="text-sm text-destructive">{errors.old_password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password">New password</Label>
            <Input id="new_password" type="password" autoComplete="new-password" {...register('new_password')} />
            {errors.new_password && <p className="text-sm text-destructive">{errors.new_password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm new password</Label>
            <Input id="confirm_password" type="password" autoComplete="new-password" {...register('confirm_password')} />
            {errors.confirm_password && <p className="text-sm text-destructive">{errors.confirm_password.message}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => close(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Change password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
