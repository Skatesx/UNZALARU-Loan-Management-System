import { useNotifications } from '@/hooks/use-notifications'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/formatters'
import { CheckCheck } from 'lucide-react'

export function MemberNotificationList() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications()

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Your notifications"
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
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200'
                  : 'bg-card hover:bg-muted/50'
              }`}
              onClick={() => markAsRead(n.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground/70">{formatRelativeTime(n.created_at)}</span>
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
