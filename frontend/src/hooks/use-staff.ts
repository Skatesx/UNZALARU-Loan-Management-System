import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'

export type StaffRole = 'ADMIN' | 'SUPERVISOR'

export interface StaffAccount {
  id: number
  email: string
  first_name: string
  last_name: string
  role: StaffRole
  is_active: boolean
  last_login: string | null
  created_at: string
}

export function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/staff/', { params: { page_size: 100 } })
      return (response.data.results ?? response.data) as StaffAccount[]
    },
  })
}

export function useCreateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { email: string; first_name: string; last_name: string; role: StaffRole }) => {
      const response = await apiClient.post('/auth/staff/', data)
      return response.data as StaffAccount & { temporary_password: string }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  })
}

export function useUpdateStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { role?: StaffRole; is_active?: boolean } }) => {
      const response = await apiClient.patch(`/auth/staff/${id}/`, data)
      return response.data as StaffAccount
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  })
}

/** Admin sets a temporary password for a member or staff account (returned once). */
export function useAdminResetPassword() {
  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiClient.post(`/auth/users/${userId}/reset-password/`)
      return response.data as { email: string; temporary_password: string }
    },
  })
}
