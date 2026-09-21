import { format, formatDistanceToNow } from 'date-fns'

export function formatCurrency(amount: number): string {
  return `K${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(dateString: string): string {
  return format(new Date(dateString), 'dd MMM yyyy')
}

export function formatDateTime(dateString: string): string {
  return format(new Date(dateString), 'dd MMM yyyy, HH:mm')
}

export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true })
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25',
    UNDER_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/25',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25',
    REJECTED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/25',
    CANCELLED: 'bg-muted text-muted-foreground border-border',
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25',
    DEFAULTED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/25',
    WRITTEN_OFF: 'bg-muted text-muted-foreground border-border',
    PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25',
    OVERDUE: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/25',
    PARTIALLY_PAID: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25',
    CURRENT: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25',
    AT_RISK: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/25',
    DEFAULTER: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/25',
    SEVERE_DEFAULTER: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40',
    ELIGIBLE: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25',
    REVIEW: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25',
    NOT_ELIGIBLE: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/25',
  }
  return colors[status] || 'bg-muted text-muted-foreground border-border'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    UNDER_REVIEW: 'Under Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    DEFAULTED: 'Defaulted',
    WRITTEN_OFF: 'Written Off',
    PAID: 'Paid',
    OVERDUE: 'Overdue',
    PARTIALLY_PAID: 'Partially Paid',
    CURRENT: 'Current',
    AT_RISK: 'At Risk',
    DEFAULTER: 'Defaulter',
    SEVERE_DEFAULTER: 'Severe Defaulter',
    ELIGIBLE: 'Eligible',
    REVIEW: 'Review',
    NOT_ELIGIBLE: 'Not Eligible',
  }
  return labels[status] || status
}
