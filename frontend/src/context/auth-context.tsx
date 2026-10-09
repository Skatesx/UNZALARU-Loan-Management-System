import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User, UserRole } from '@/types/auth'
import { authApi } from '@/api/auth'
import {
  setTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  apiClient,
} from '@/api/client'
import { jwtDecode } from 'jwt-decode'

interface TokenPayload {
  user_id: number
  role: string
  email: string
  first_name: string
  last_name: string
  exp?: number
  iat?: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isSupervisor: boolean
  isStaff: boolean
  isMember: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const decodeToken = (token: string): TokenPayload | null => {
    try {
      return jwtDecode<TokenPayload>(token)
    } catch {
      return null
    }
  }

  const buildUserFromToken = (payload: TokenPayload): User => ({
    id: payload.user_id,
    email: payload.email,
    username: payload.email.split('@')[0],
    first_name: payload.first_name,
    last_name: payload.last_name,
    role: payload.role as UserRole,
    is_active: true,
    created_at: '',
    updated_at: '',
  })

  // Try to restore session on mount
  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      const payload = decodeToken(token)
      if (payload) {
        // Check expiry
        const now = Date.now() / 1000
        if (payload.exp && payload.exp > now) {
          setUser(buildUserFromToken(payload))
        } else if (!payload.exp) {
          setUser(buildUserFromToken(payload))
        } else {
          clearTokens()
        }
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    setTokens(response.access, response.refresh)

    const payload = decodeToken(response.access)
    const nextUser = payload ? buildUserFromToken(payload) : null
    if (nextUser) {
      setUser(nextUser)
    }
    return nextUser as User
  }, [])

  const logout = useCallback(async () => {
    const refresh = getRefreshToken()
    if (refresh) {
      try {
        await authApi.logout(refresh)
      } catch {
        // Ignore logout errors
      }
    }
    clearTokens()
    setUser(null)
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isSupervisor: user?.role === 'SUPERVISOR',
    isStaff: user?.role === 'ADMIN' || user?.role === 'SUPERVISOR',
    isMember: user?.role === 'MEMBER',
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
