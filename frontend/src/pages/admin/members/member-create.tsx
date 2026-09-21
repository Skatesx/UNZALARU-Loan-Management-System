import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateMember } from '@/hooks/use-members'
import { memberCreateSchema, type MemberCreateFormData } from '@/lib/validators'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function MemberCreate() {
  const navigate = useNavigate()
  const createMember = useCreateMember()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberCreateFormData>({
    resolver: zodResolver(memberCreateSchema),
  })

  const employmentStatus = watch('employment_status')

  const onSubmit = async (data: MemberCreateFormData) => {
    try {
      await createMember.mutateAsync(data)
      toast.success('Member created successfully')
      navigate('/admin/members')
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: Record<string, string[]> } }
      const errorMsg = axiosError.response?.data
        ? Object.values(axiosError.response.data).flat().join(', ')
        : 'Failed to create member'
      toast.error(errorMsg)
    }
  }

  return (
    <div>
      <PageHeader title="Create Member" description="Add a new member to the system" />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Member Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Account section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Account Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" {...register('email')} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input id="username" {...register('username')} />
                  {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input id="first_name" {...register('first_name')} />
                  {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input id="last_name" {...register('last_name')} />
                  {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" type="password" {...register('password')} />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
              </div>
            </div>

            {/* Profile section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Profile Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nrc_number">NRC Number *</Label>
                  <Input id="nrc_number" {...register('nrc_number')} />
                  {errors.nrc_number && <p className="text-sm text-destructive">{errors.nrc_number.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input id="phone_number" {...register('phone_number')} />
                  {errors.phone_number && <p className="text-sm text-destructive">{errors.phone_number.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input id="department" {...register('department')} />
                  {errors.department && <p className="text-sm text-destructive">{errors.department.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Employment Status *</Label>
                  <Select
                    value={employmentStatus}
                    onValueChange={(val) => setValue('employment_status', val as 'PERMANENT' | 'CONTRACT' | 'PART_TIME' | 'RETIRED')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERMANENT">Permanent</SelectItem>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="PART_TIME">Part Time</SelectItem>
                      <SelectItem value="RETIRED">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.employment_status && <p className="text-sm text-destructive">{errors.employment_status.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly_income">Monthly Income (K) *</Label>
                  <Input id="monthly_income" type="number" step="0.01" {...register('monthly_income')} />
                  {errors.monthly_income && <p className="text-sm text-destructive">{errors.monthly_income.message}</p>}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea id="address" {...register('address')} />
                  {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/members')}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMember.isPending}>
                {createMember.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Member'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
