export type UserRole = 'MEMBER' | 'SUPERVISOR' | 'ADMIN'

export interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh: string
}

export interface TokenPayload {
  token_type: string
  exp: number
  iat: number
  jti: string
  user_id: number
  role: string
  email: string
  first_name: string
  last_name: string
}

export interface PasswordChangeRequest {
  old_password: string
  new_password: string
}
