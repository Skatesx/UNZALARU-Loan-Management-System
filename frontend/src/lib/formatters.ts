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
    PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
    UNDER_REVIEW: 'bg-blue-100 text-blue-800 border-blue-200',
    APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
    CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
    ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    DEFAULTED: 'bg-red-100 text-red-800 border-red-200',
    WRITTEN_OFF: 'bg-gray-100 text-gray-800 border-gray-200',
    PAID: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    OVERDUE: 'bg-red-100 text-red-800 border-red-200',
    PARTIALLY_PAID: 'bg-amber-100 text-amber-800 border-amber-200',
    CURRENT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    AT_RISK: 'bg-orange-100 text-orange-800 border-orange-200',
    DEFAULTER: 'bg-red-100 text-red-800 border-red-200',
    SEVERE_DEFAULTER: 'bg-red-200 text-red-900 border-red-300',
    ELIGIBLE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    REVIEW: 'bg-amber-100 text-amber-800 border-amber-200',
    NOT_ELIGIBLE: 'bg-red-100 text-red-800 border-red-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
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
