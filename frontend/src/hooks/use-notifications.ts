import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { NotificationListItem } from '@/types/notification'
import { useState, useEffect, useCallback } from 'react'

interface PaginatedResponse {
  count: number
  results: NotificationListItem[]
}

export function useNotifications() {
  const queryClient = useQueryClient()
  const [unreadCount, setUnreadCount] = useState(0)

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse>('/notifications/')
      return response.data.results || response.data
    },
    refetchInterval: 30000, // Poll every 30 seconds
  })

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await apiClient.get<{ count: number }>('/notifications/unread-count/')
      return response.data.count
    },
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (unread !== undefined) {
      setUnreadCount(unread)
    }
  }, [unread])

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.put(`/notifications/${id}/read/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/notifications/mark-all-read/')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  const markAsRead = useCallback((id: number) => {
    markAsReadMutation.mutate(id)
  }, [markAsReadMutation])

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  return {
    notifications: data || [],
    unreadCount,
    markAsRead,
    markAllAsRead,
  }
}
