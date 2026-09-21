import { cn } from '@/lib/utils'
import { getStatusColor, getStatusLabel } from '@/lib/formatters'
import {
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  Ban,
  CircleDot,
  AlertTriangle,
  BadgeCheck,
} from 'lucide-react'

/** Small leading icon per status family — subtle visual anchor for scanning tables. */
const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  PENDING: Clock,
  UNDER_REVIEW: Eye,
  APPROVED: CheckCircle2,
  ACTIVE: CircleDot,
  COMPLETED: BadgeCheck,
  PAID: BadgeCheck,
  CURRENT: CheckCircle2,
  REJECTED: XCircle,
  DEFAULTED: AlertTriangle,
  OVERDUE: AlertTriangle,
  DEFAULTER: AlertTriangle,
  SEVERE_DEFAULTER: AlertTriangle,
  CANCELLED: Ban,
  WRITTEN_OFF: Ban,
}

interface StatusBadgeProps {
  status: string
  className?: string
  withIcon?: boolean
}

export function StatusBadge({ status, className, withIcon = false }: StatusBadgeProps) {
  const Icon = withIcon ? statusIcons[status] : undefined
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap',
        getStatusColor(status),
        className
      )}
    >
      {Icon && <Icon className="size-3" />}
      {getStatusLabel(status)}
    </span>
  )
}
