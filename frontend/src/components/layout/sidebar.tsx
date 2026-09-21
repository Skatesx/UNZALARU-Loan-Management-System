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
  Landmark,
} from 'lucide-react'

interface SidebarLink {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface SidebarGroup {
  label?: string
  links: SidebarLink[]
}

const adminLinks: SidebarGroup[] = [
  {
    links: [{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Membership',
    links: [{ label: 'Members', href: '/admin/members', icon: Users }],
  },
  {
    label: 'Lending',
    links: [
      { label: 'Applications', href: '/admin/loans/applications', icon: FileText },
      { label: 'Loans', href: '/admin/loans', icon: CreditCard },
      { label: 'Repayments', href: '/admin/repayments', icon: HandCoins },
      { label: 'Defaulters', href: '/admin/defaulters', icon: AlertTriangle },
    ],
  },
  {
    label: 'Insights',
    links: [
      { label: 'Reports', href: '/admin/reports/loans', icon: BarChart3 },
      { label: 'Audit Log', href: '/admin/audit', icon: ClipboardList },
    ],
  },
  {
    label: 'System',
    links: [
      { label: 'Configuration', href: '/admin/config/loan-types', icon: Settings },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
    ],
  },
]

const memberLinks: SidebarGroup[] = [
  {
    links: [{ label: 'Dashboard', href: '/member/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Borrowing',
    links: [
      { label: 'Apply for Loan', href: '/member/apply-loan', icon: HandCoins },
      { label: 'My Applications', href: '/member/my-applications', icon: FileText },
      { label: 'My Loans', href: '/member/my-loans', icon: CreditCard },
      { label: 'Repayment History', href: '/member/repayment-history', icon: History },
    ],
  },
  {
    label: 'Account',
    links: [
      { label: 'My Profile', href: '/member/profile', icon: User },
      { label: 'Eligibility', href: '/member/eligibility', icon: Award },
      { label: 'Notifications', href: '/member/notifications', icon: Bell },
    ],
  },
]

interface SidebarProps {
  role: 'ADMIN' | 'MEMBER'
}

interface SidebarContentProps {
  role: 'ADMIN' | 'MEMBER'
  collapsed: boolean
  onToggleCollapse: () => void
  onNavigate?: () => void
}

function SidebarContent({ role, collapsed, onToggleCollapse, onNavigate }: SidebarContentProps) {
  const location = useLocation()
  const groups = role === 'ADMIN' ? adminLinks : memberLinks

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/')

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-16 border-b border-sidebar-border shrink-0',
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}
      >
        {!collapsed && (
          <Link
            to={role === 'ADMIN' ? '/admin/dashboard' : '/member/dashboard'}
            onClick={onNavigate}
            className="flex items-center gap-2.5 min-w-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm shrink-0">
              <Landmark className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm leading-tight tracking-tight">
                UNZALARU
              </div>
              <div className="text-[10px] text-sidebar-foreground/50 leading-tight truncate">
                {role === 'ADMIN' ? 'Admin Console' : 'Member Portal'}
              </div>
            </div>
          </Link>
        )}
        <button
          onClick={onToggleCollapse}
          className={cn(
            'hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent transition-colors',
            collapsed && 'mx-auto'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5">
        {groups.map((group, gi) => (
          <div key={group.label || gi} className={cn(gi > 0 && 'mt-5')}>
            {group.label && !collapsed && (
              <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/40">
                {group.label}
              </div>
            )}
            {group.label && collapsed && (
              <div className="mx-2.5 mb-2 border-t border-sidebar-border/60" />
            )}
            <ul className="space-y-0.5">
              {group.links.map((link) => {
                const Icon = link.icon
                const active = isActive(link.href)
                return (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      onClick={onNavigate}
                      title={collapsed ? link.label : undefined}
                      className={cn(
                        'group relative flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50',
                        collapsed ? 'justify-center px-2 py-2' : 'px-2.5 py-2',
                        active
                          ? 'bg-sidebar-accent text-white'
                          : 'text-sidebar-foreground/65 hover:text-white hover:bg-sidebar-accent/50'
                      )}
                    >
                      {/* Active accent bar */}
                      <span
                        className={cn(
                          'absolute left-0 top-1/2 -translate-y-1/2 h-4.5 w-0.5 rounded-full bg-emerald-400 transition-opacity',
                          active ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <Icon
                        className={cn(
                          'w-4.5 h-4.5 shrink-0 transition-colors',
                          active
                            ? 'text-emerald-300'
                            : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground'
                        )}
                      />
                      {!collapsed && <span className="truncate">{link.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn('border-t border-sidebar-border px-3 py-3 shrink-0', collapsed && 'px-2')}>
        {!collapsed ? (
          <div className="flex items-center gap-2 text-[11px] text-sidebar-foreground/45">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
            {role === 'ADMIN' ? 'Administrator' : 'Member'} · Loan Portal
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
          </div>
        )}
      </div>
    </div>
  )
}

export function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-sidebar text-sidebar-foreground rounded-lg shadow-lg ring-1 ring-white/10"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-sidebar shadow-2xl animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 z-10 p-1.5 rounded-md text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent
              role={role}
              collapsed={false}
              onToggleCollapse={() => setCollapsed(!collapsed)}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-sidebar h-screen sticky top-0 transition-[width] duration-300 ease-in-out shrink-0',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent
          role={role}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </aside>
    </>
  )
}
