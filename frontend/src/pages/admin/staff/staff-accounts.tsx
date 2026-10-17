import { useState } from 'react'
import {
  useStaff,
  useCreateStaff,
  useUpdateStaff,
  useAdminResetPassword,
  type StaffAccount,
  type StaffRole,
} from '@/hooks/use-staff'
import { useAuth } from '@/hooks/use-auth'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { TemporaryPasswordDialog } from '@/components/shared/temporary-password-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime } from '@/lib/formatters'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'

const th = 'text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground'
const ROLE_LABELS: Record<StaffRole, string> = { ADMIN: 'Admin', SUPERVISOR: 'Supervisor' }

function apiError(err: unknown, fallback: string) {
  const data = (err as { response?: { data?: Record<string, unknown> } }).response?.data
  if (!data) return fallback
  if (typeof data.error === 'string') return data.error
  const first = Object.values(data)[0]
  return Array.isArray(first) ? String(first[0]) : fallback
}

type PendingAction =
  | { kind: 'role'; account: StaffAccount; role: StaffRole }
  | { kind: 'active'; account: StaffAccount; active: boolean }
  | { kind: 'reset'; account: StaffAccount }

/** Admin-only: add admins and supervisors, change roles, switch accounts off, reset passwords. */
export function StaffAccounts() {
  const { user } = useAuth()
  const { data: staff, isLoading, error, refetch } = useStaff()
  const createStaff = useCreateStaff()
  const updateStaff = useUpdateStaff()
  const resetPassword = useAdminResetPassword()

  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', role: 'SUPERVISOR' as StaffRole })
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [shownPassword, setShownPassword] = useState<{ email: string; password: string; title?: string } | null>(null)

  const activeAdmins = (staff || []).filter((s) => s.role === 'ADMIN' && s.is_active).length

  const handleAdd = async () => {
    try {
      const created = await createStaff.mutateAsync(form)
      setAddOpen(false)
      setForm({ first_name: '', last_name: '', email: '', role: 'SUPERVISOR' })
      setShownPassword({
        email: created.email,
        password: created.temporary_password,
        title: `${ROLE_LABELS[created.role]} account created`,
      })
    } catch (err) {
      toast.error(apiError(err, 'Failed to add the account'))
    }
  }

  const runPending = async () => {
    if (!pending) return
    const action = pending
    setPending(null)
    try {
      if (action.kind === 'reset') {
        const result = await resetPassword.mutateAsync(action.account.id)
        setShownPassword({ email: result.email, password: result.temporary_password })
      } else if (action.kind === 'role') {
        await updateStaff.mutateAsync({ id: action.account.id, data: { role: action.role } })
        toast.success(`${action.account.first_name} is now ${ROLE_LABELS[action.role].toLowerCase()}`)
      } else {
        await updateStaff.mutateAsync({ id: action.account.id, data: { is_active: action.active } })
        toast.success(`${action.account.first_name}'s account was ${action.active ? 'reactivated' : 'deactivated'}`)
      }
    } catch (err) {
      toast.error(apiError(err, 'Something went wrong'))
    }
  }

  if (isLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load staff accounts" onRetry={() => refetch()} />

  const pendingText = (() => {
    if (!pending) return { title: '', body: '', confirm: '' }
    const name = `${pending.account.first_name} ${pending.account.last_name}`
    if (pending.kind === 'reset') {
      return {
        title: `Reset ${name}'s password?`,
        body: 'Their current password stops working and a temporary one is shown for you to hand over.',
        confirm: 'Reset password',
      }
    }
    if (pending.kind === 'role') {
      return {
        title: `Make ${name} ${ROLE_LABELS[pending.role].toLowerCase()}?`,
        body: pending.role === 'ADMIN'
          ? 'Admins can manage members, settings, staff accounts and confirm payroll deductions.'
          : 'Supervisors handle day-to-day loan work but cannot manage members, settings or staff.',
        confirm: 'Change role',
      }
    }
    return pending.active
      ? { title: `Reactivate ${name}?`, body: 'They will be able to sign in again.', confirm: 'Reactivate' }
      : { title: `Deactivate ${name}?`, body: 'They will no longer be able to sign in. Their past actions stay in the audit log.', confirm: 'Deactivate' }
  })()

  return (
    <div>
      <PageHeader
        title="Staff Accounts"
        description="Admins and supervisors who run UNZALARU loans"
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add staff
          </Button>
        }
      />

      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className={th}>Name</th>
                <th className={th}>Role</th>
                <th className={th}>Status</th>
                <th className={th}>Last sign-in</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(staff || []).map((account) => {
                const isSelf = account.id === user?.id
                const lastAdmin = account.role === 'ADMIN' && account.is_active && activeAdmins <= 1
                return (
                  <tr key={account.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {account.first_name} {account.last_name}
                        {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{account.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={account.role}
                        items={ROLE_LABELS}
                        disabled={isSelf || (lastAdmin && account.role === 'ADMIN')}
                        onValueChange={(v) =>
                          v && v !== account.role && setPending({ kind: 'role', account, role: v as StaffRole })
                        }
                      >
                        <SelectTrigger className="w-36" aria-label={`Role for ${account.first_name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                        account.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {account.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {account.last_login ? formatDateTime(account.last_login) : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setPending({ kind: 'reset', account })}>
                          Reset password
                        </Button>
                        {!isSelf && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={account.is_active && lastAdmin}
                            title={account.is_active && lastAdmin ? 'There must always be at least one active admin' : undefined}
                            onClick={() => setPending({ kind: 'active', account, active: !account.is_active })}
                          >
                            {account.is_active ? 'Deactivate' : 'Reactivate'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add staff</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              handleAdd()
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="first_name">First name</Label>
                <Input id="first_name" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input id="last_name" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} items={ROLE_LABELS} onValueChange={(v) => setForm({ ...form, role: (v || 'SUPERVISOR') as StaffRole })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              A temporary password is created and shown once for you to hand over.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createStaff.isPending}>
                {createStaff.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingText.title}</AlertDialogTitle>
            <AlertDialogDescription>{pendingText.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={pending?.kind === 'active' && !pending.active ? 'destructive' : 'default'}
              onClick={runPending}
            >
              {pendingText.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TemporaryPasswordDialog value={shownPassword} onClose={() => setShownPassword(null)} />
    </div>
  )
}
