export interface AuditLog {
  id: number
  user: number | null
  user_email: string | null
  action: string
  entity_type: string
  entity_id: string
  description: string
  previous_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  ip_address: string | null
  timestamp: string
}
