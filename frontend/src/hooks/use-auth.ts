export { useAuth } from '@/context/auth-context'

import { useLocation } from 'react-router-dom'

import { useAuth } from '@/context/auth-context'

/**
 * URL prefix for staff (union-office) areas: '/supervisor' when the current
 * page is mounted under /supervisor, '/admin' when under /admin, else by
 * role (supervisors get '/supervisor', everyone else '/admin').
 */
export function useStaffBase(): string {
  const { isSupervisor } = useAuth()
  const { pathname } = useLocation()
  if (pathname.startsWith('/supervisor')) return '/supervisor'
  if (pathname.startsWith('/admin')) return '/admin'
  return isSupervisor ? '/supervisor' : '/admin'
}
