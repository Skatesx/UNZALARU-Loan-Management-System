import { useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/components/ui/theme-provider'
import { useNotifications } from '@/hooks/use-notifications'
import { formatRelativeTime } from '@/lib/formatters'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sun, Moon, Bell, LogOut, User, ChevronDown, CheckCheck, PanelTop } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Header() {
  const { user, logout, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const navigate = useNavigate()

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() ||
      user.email[0].toUpperCase()
    : '?'

  return (
    <header className="h-16 border-b bg-card flex items-center justify-end px-4 sm:px-6 gap-1.5 shrink-0 sticky top-0 z-30">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
      </button>

      {/* Notification bell */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="w-[18px] h-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full flex items-center justify-center ring-2 ring-card">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[22rem]">
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-4"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>
          <DropdownMenuSeparator />
          <ScrollArea className="h-80">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Updates about your loans will appear here
                </p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    'px-3 py-3 cursor-pointer items-start',
                    !notification.is_read && 'bg-primary/5'
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-medium leading-snug">
                        {notification.title}
                      </span>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70">
                      {formatRelativeTime(notification.created_at)}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </ScrollArea>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center text-[13px] text-primary cursor-pointer" onClick={() => navigate(isAdmin ? '/admin/notifications' : '/member/notifications')}>
            <span className="flex items-center gap-1.5">
              <PanelTop className="w-3.5 h-3.5" />
              View all notifications
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-6 bg-border mx-1" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 p-1.5 pr-2 rounded-lg hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start leading-tight">
            <span className="text-[13px] font-medium text-foreground">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-[10px] text-muted-foreground capitalize">
              {user?.role?.toLowerCase()}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2.5 py-2 md:hidden">
            <p className="text-sm font-medium">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <DropdownMenuSeparator className="md:hidden" />
          <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(isAdmin ? '/admin/members' : '/member/profile')}>
            <User className="w-4 h-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className="flex items-center gap-2 cursor-pointer text-destructive data-[variant=destructive]:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
