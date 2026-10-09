import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import type { UserRole } from '@/types/auth'

interface GuardProps {
  children: React.ReactNode
  roles?: UserRole[]
}

/** Home route for a given role. */
export function homeForRole(role?: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard'
    case 'SUPERVISOR':
      return '/supervisor/dashboard'
    default:
      return '/member/dashboard'
  }
}

/**
 * Role-aware guard. When `roles` is omitted any authenticated user passes.
 * Authenticated users hitting a route they lack rights for are redirected to
 * their own home page.
 */
export function RoleGuard({ children, roles }: GuardProps) {
  const { isAuthenticated, user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSkeleton type="form" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && (!user || !roles.includes(user.role))) {
    return <Navigate to={homeForRole(user?.role)} replace />
  }

  return <>{children}</>
}

// Backwards-compatible aliases used across the app.
export const AuthGuard = RoleGuard
export const AdminGuard = RoleGuard // AdminLayout passes roles=['ADMIN'] itself
export const MemberGuard = RoleGuard

export function GuestGuard({ children }: GuardProps) {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSkeleton type="form" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={homeForRole(user?.role)} replace />
  }

  return <>{children}</>
}
