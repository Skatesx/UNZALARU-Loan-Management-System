import type { LoginRequest, LoginResponse, PasswordChangeRequest } from '@/types/auth'
import apiClient from './client'

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login/', data)
    return response.data
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout/', { refresh: refreshToken })
  },

  changePassword: async (data: PasswordChangeRequest): Promise<void> => {
    await apiClient.post('/auth/password-change/', data)
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/password-reset/', { email })
  },

  confirmPasswordReset: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/password-reset/confirm/', {
      token,
      new_password: newPassword,
    })
  },
}
