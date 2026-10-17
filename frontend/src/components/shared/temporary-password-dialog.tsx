import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'

interface TemporaryPasswordDialogProps {
  /** { email, password } to show, or null when closed */
  value: { email: string; password: string; title?: string } | null
  onClose: () => void
}

/** Shows a generated temporary password once, for the admin to hand over. */
export function TemporaryPasswordDialog({ value, onClose }: TemporaryPasswordDialogProps) {
  const copy = async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value.password)
      toast.success('Password copied')
    } catch {
      toast.error('Could not copy; select the password and copy it instead')
    }
  }

  return (
    <AlertDialog open={value !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{value?.title ?? 'Temporary password'}</AlertDialogTitle>
          <AlertDialogDescription>
            Give this password to {value?.email}. It is only shown once; they should change it
            from the account menu after signing in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center gap-2">
          <code className="flex-1 select-all rounded-md border bg-muted px-3 py-2 text-center font-mono text-base tracking-wider">
            {value?.password}
          </code>
          <Button type="button" variant="outline" size="sm" onClick={copy} aria-label="Copy password">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Done</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
