import { useState } from 'react'
import { useLoanTypes, useCreateLoanType, useUpdateLoanType } from '@/hooks/use-loans'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Pencil } from 'lucide-react'
import type { InterestMethod } from '@/types/loan'

interface LoanTypeFormData {
  name: string
  description: string
  min_amount: number
  max_amount: number
  min_duration_months: number
  max_duration_months: number
  interest_rate: number
  interest_method: InterestMethod
  allow_multiple_active: boolean
  is_active: boolean
}

const defaultForm: LoanTypeFormData = {
  name: '',
  description: '',
  min_amount: 0,
  max_amount: 0,
  min_duration_months: 1,
  max_duration_months: 12,
  interest_rate: 0,
  interest_method: 'FLAT',
  allow_multiple_active: false,
  is_active: true,
}

export function LoanTypeConfig() {
  const { data: loanTypes, isLoading, error, refetch } = useLoanTypes()
  const createLoanType = useCreateLoanType()
  const updateLoanType = useUpdateLoanType()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<LoanTypeFormData>(defaultForm)

  const handleOpen = (loanType?: any) => {
    if (loanType) {
      setEditingId(loanType.id)
      setForm({
        name: loanType.name || '',
        description: loanType.description || '',
        min_amount: Number(loanType.min_amount) || 0,
        max_amount: Number(loanType.max_amount) || 0,
        min_duration_months: loanType.min_duration_months || 1,
        max_duration_months: loanType.max_duration_months || 12,
        interest_rate: Number(loanType.interest_rate) || 0,
        interest_method: loanType.interest_method || 'FLAT',
        allow_multiple_active: loanType.allow_multiple_active || false,
        is_active: loanType.is_active !== false,
      })
    } else {
      setEditingId(null)
      setForm(defaultForm)
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateLoanType.mutateAsync({ id: editingId, data: form as any })
        toast.success('Loan type updated')
      } else {
        await createLoanType.mutateAsync(form as any)
        toast.success('Loan type created')
      }
      setDialogOpen(false)
      refetch()
    } catch {
      toast.error('Failed to save loan type')
    }
  }

  if (isLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load loan types" onRetry={() => refetch()} />

  const types = Array.isArray(loanTypes) ? loanTypes : (loanTypes as any)?.results || []

  return (
    <div>
      <PageHeader
        title="Loan Type Configuration"
        description="Manage loan types and their parameters"
        actions={
          <Button onClick={() => handleOpen()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Loan Type
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {types.map((lt: any) => (
          <Card key={lt.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{lt.name}</CardTitle>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${lt.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                  {lt.is_active ? 'Active' : 'Inactive'}
                </span>
                <Button variant="ghost" size="sm" onClick={() => handleOpen(lt)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{lt.description}</p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <p className="text-xs text-muted-foreground/70">Amount Range</p>
                  <p className="font-medium">K{Number(lt.min_amount).toLocaleString()} — K{Number(lt.max_amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/70">Duration</p>
                  <p className="font-medium">{lt.min_duration_months}—{lt.max_duration_months} months</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/70">Interest Rate</p>
                  <p className="font-medium">{lt.interest_rate}% ({lt.interest_method})</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/70">Multiple Active</p>
                  <p className="font-medium">{lt.allow_multiple_active ? 'Allowed' : 'Not Allowed'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Loan Type' : 'Create Loan Type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Min Amount</Label>
                <Input type="number" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Max Amount</Label>
                <Input type="number" value={form.max_amount} onChange={(e) => setForm({ ...form, max_amount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Min Duration (months)</Label>
                <Input type="number" value={form.min_duration_months} onChange={(e) => setForm({ ...form, min_duration_months: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Max Duration (months)</Label>
                <Input type="number" value={form.max_duration_months} onChange={(e) => setForm({ ...form, max_duration_months: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Interest Rate (%)</Label>
                <Input type="number" step="0.01" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={form.interest_method} onValueChange={(v) => setForm({ ...form, interest_method: (v || 'FLAT') as InterestMethod })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT">Flat Rate</SelectItem>
                    <SelectItem value="REDUCING_BALANCE">Reducing Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.allow_multiple_active} onCheckedChange={(v) => setForm({ ...form, allow_multiple_active: v })} />
                <Label>Allow multiple active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={createLoanType.isPending || updateLoanType.isPending}>
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
