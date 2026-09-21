import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useMyProfile, useUpdateMyProfile } from '@/hooks/use-members'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import {
  Mail,
  Phone,
  Building,
  Calendar,
  CreditCard,
  MapPin,
  BadgeCheck,
  Clock,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

export function MemberProfile() {
  const { user } = useAuth()
  const { data: profile, isLoading, error, refetch } = useMyProfile()
  const updateProfile = useUpdateMyProfile()

  const [editing, setEditing] = useState(false)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone_number || '')
      setAddress(profile.address || '')
    }
  }, [profile])

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ phone_number: phone, address: address })
      setEditing(false)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    }
  }

  if (isLoading) return <LoadingSkeleton type="detail" />
  if (error) return <ErrorState message="Failed to load your profile" onRetry={() => refetch()} />
  if (!profile) return <ErrorState message="Profile not found" />

  const isPending = profile.membership_status === 'PENDING'

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Your membership and account information"
        actions={
          !editing ? (
            <Button variant="outline" onClick={() => setEditing(true)}>
              Edit contact details
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateProfile.isPending}>
                {updateProfile.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save
              </Button>
            </div>
          )
        }
      />

      {isPending && (
        <div className="mb-6 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-300">
                Membership pending approval
              </p>
              <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                A UNZALARU administrator needs to approve your membership before
                you can apply for loans.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground/70" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{profile.email || user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-muted-foreground/70" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member ID</p>
                    <p className="text-sm font-medium">{profile.member_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {editing ? (
                    <div className="w-full space-y-1">
                      <Label htmlFor="phone_number">Phone number</Label>
                      <Input
                        id="phone_number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 text-muted-foreground/70" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium">{profile.phone_number}</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-muted-foreground/70" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="text-sm font-medium">{profile.department}</p>
                  </div>
                </div>
              </div>
              <div>
                {editing ? (
                  <div className="space-y-1">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground/70" />
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm">{profile.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Membership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={profile.membership_status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account</span>
                <StatusBadge status={profile.account_status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Registered</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                  {formatDateTime(profile.created_at)}
                </span>
              </div>
              {profile.approval_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Approved</span>
                  <span className="text-sm font-medium">
                    {formatDateTime(profile.approval_date)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-medium capitalize">
                  {profile.employment_status.replace(/_/g, ' ').toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Declared monthly income</p>
                <p className="text-sm font-bold text-primary">
                  {formatCurrency(profile.monthly_income)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Income verification</p>
                {profile.income_verified ? (
                  <p className="text-sm font-medium flex items-center gap-1.5 text-primary">
                    <BadgeCheck className="w-4 h-4" />
                    Verified{profile.verified_income != null && ` — ${formatCurrency(profile.verified_income)}`}
                  </p>
                ) : (
                  <p className="text-sm text-amber-600 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Awaiting administrator verification
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
