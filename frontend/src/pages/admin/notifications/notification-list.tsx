import { useNotifications } from '@/hooks/use-notifications'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { formatRelativeTime } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { CheckCheck } from 'lucide-react'

export function AdminNotificationList() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications()

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="System notifications"
        actions={
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        }
      />

      {notifications.length === 0 ? (
        <EmptyState title="No notifications" description="You have no notifications yet." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                !n.is_read
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                  : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
              onClick={() => markAsRead(n.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{formatRelativeTime(n.created_at)}</span>
                  {!n.is_read && <span className="w-2 h-2 bg-emerald-500 rounded-full" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
