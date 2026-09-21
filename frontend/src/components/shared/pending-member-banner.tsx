import { Link } from 'react-router-dom'
import { useMyProfile } from '@/hooks/use-members'
import { Clock, ShieldCheck, Lock } from 'lucide-react'

/**
 * Shows a pending-approval banner when the signed-in member's membership
 * is still PENDING. Returns null for admins or approved members.
 */
export function PendingMemberBanner() {
  const { data: profile, isLoading } = useMyProfile()

  if (isLoading || !profile) return null
  if (profile.membership_status !== 'PENDING') return null

  return (
    <div className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50/80 dark:border-amber-500/25 dark:bg-amber-500/10 p-4 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.5)] dark:shadow-none">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="text-sm min-w-0">
          <p className="font-semibold text-amber-900 dark:text-amber-300">
            Membership pending approval
          </p>
          <p className="text-amber-800/90 dark:text-amber-400/90 mt-0.5 leading-relaxed">
            Your account is awaiting approval by a UNZALARU administrator. You can
            view your profile and track your membership status, but loan
            applications unlock once your membership is approved.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Inline gate shown in place of locked member features (e.g. the apply form).
 */
export function PendingFeatureGate({
  feature,
  children,
}: {
  feature: string
  children: React.ReactNode
}) {
  const { data: profile, isLoading } = useMyProfile()

  if (isLoading) return null
  if (!profile || profile.membership_status !== 'PENDING') return <>{children}</>

  return (
    <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-500/10 p-10 text-center">
      <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="font-semibold text-amber-900 dark:text-amber-300">
        {feature} is locked
      </h3>
      <p className="text-sm text-amber-800/90 dark:text-amber-400/90 mt-1.5 max-w-md mx-auto leading-relaxed">
        Your membership is pending approval by a UNZALARU administrator. This
        feature becomes available as soon as your membership is approved.
      </p>
      <Link
        to="/member/profile"
        className="inline-flex items-center gap-1.5 mt-5 text-sm font-medium text-amber-900 dark:text-amber-300 hover:underline underline-offset-4"
      >
        <ShieldCheck className="w-4 h-4" />
        View my membership status
      </Link>
    </div>
  )
}
