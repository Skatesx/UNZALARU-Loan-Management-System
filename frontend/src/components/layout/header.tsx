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
import { Sun, Moon, Bell, LogOut, User, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Header() {
  const { user, logout, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    || user.email[0].toUpperCase()
    : '?'

  return (
    <header className="h-16 border-b bg-white dark:bg-gray-950 flex items-center justify-end px-4 gap-2 shrink-0">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5 text-gray-500" />
        ) : (
          <Sun className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Notification bell */}
      <DropdownMenu>
        <DropdownMenuTrigger className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Bell className="w-5 h-5 text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-emerald-600 hover:text-emerald-700"
              >
                Mark all read
              </button>
            )}
          </div>
          <DropdownMenuSeparator />
          <ScrollArea className="h-80">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`px-4 py-3 cursor-pointer ${!notification.is_read ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium">{notification.title}</span>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{notification.message}</p>
                    <span className="text-[10px] text-gray-400">
                      {formatRelativeTime(notification.created_at)}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </ScrollArea>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="justify-center text-sm">
            <Link to={isAdmin ? '/admin/notifications' : '/member/notifications'}>
              View all notifications
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium">
              {user?.first_name} {user?.last_name}
            </span>
            <span className="text-[10px] text-gray-500 capitalize">
              {user?.role?.toLowerCase()}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem className="flex items-center gap-2">
            <Link to={isAdmin ? '/admin/members' : '/member/profile'} className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-red-600">
            <LogOut className="w-4 h-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
