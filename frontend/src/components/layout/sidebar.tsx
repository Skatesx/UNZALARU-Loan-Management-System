import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Settings,
  Bell,
  User,
  HandCoins,
  History,
  Award,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'

interface SidebarLink {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const adminLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Members', href: '/admin/members', icon: Users },
  { label: 'Applications', href: '/admin/loans/applications', icon: FileText },
  { label: 'Loans', href: '/admin/loans', icon: CreditCard },
  { label: 'Repayments', href: '/admin/repayments', icon: HandCoins },
  { label: 'Defaulters', href: '/admin/defaulters', icon: AlertTriangle },
  { label: 'Reports', href: '/admin/reports/loans', icon: BarChart3 },
  { label: 'Audit Log', href: '/admin/audit', icon: ClipboardList },
  { label: 'Configuration', href: '/admin/config/loan-types', icon: Settings },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
]

const memberLinks: SidebarLink[] = [
  { label: 'Dashboard', href: '/member/dashboard', icon: LayoutDashboard },
  { label: 'My Profile', href: '/member/profile', icon: User },
  { label: 'Apply for Loan', href: '/member/apply-loan', icon: HandCoins },
  { label: 'My Applications', href: '/member/my-applications', icon: FileText },
  { label: 'My Loans', href: '/member/my-loans', icon: CreditCard },
  { label: 'Repayment History', href: '/member/repayment-history', icon: History },
  { label: 'Eligibility', href: '/member/eligibility', icon: Award },
  { label: 'Notifications', href: '/member/notifications', icon: Bell },
]

interface SidebarProps {
  role: 'ADMIN' | 'MEMBER'
}

export function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const links = role === 'ADMIN' ? adminLinks : memberLinks

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/')

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-400 flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="text-white font-semibold text-sm">UNZALARU</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            const active = isActive(link.href)
            return (
              <li key={link.href}>
                <Link
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-sidebar-accent text-white'
                      : 'text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? link.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/50 uppercase tracking-wider">
            {role === 'ADMIN' ? 'Administrator' : 'Member'} Portal
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar text-white rounded-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-sidebar">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-sidebar h-screen sticky top-0 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
