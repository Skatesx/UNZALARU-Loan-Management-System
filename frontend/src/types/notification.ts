export interface Notification {
  id: number
  title: string
  message: string
  notification_type: string
  is_read: boolean
  related_loan: number | null
  related_application: number | null
  created_at: string
}

export interface NotificationListItem {
  id: number
  title: string
  message: string
  notification_type: string
  is_read: boolean
  created_at: string
}
