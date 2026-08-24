import type { User } from './auth'

export type EmploymentStatus = 'PERMANENT' | 'CONTRACT' | 'PART_TIME' | 'RETIRED'
export type MembershipStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type AccountStatus = 'ACTIVE' | 'DEACTIVATED'

export interface Member {
  id: number
  member_id: string
  user: User
  nrc_number: string
  phone_number: string
  address: string
  department: string
  employment_status: EmploymentStatus
  monthly_income: number
  date_joined: string
  membership_status: MembershipStatus
  account_status: AccountStatus
  full_name: string
  email: string
  created_at: string
  updated_at: string
}

export interface MemberListItem {
  id: number
  member_id: string
  full_name: string
  email: string
  department: string
  employment_status: EmploymentStatus
  monthly_income: number
  membership_status: MembershipStatus
  account_status: AccountStatus
  date_joined: string
}

export interface MemberCreateRequest {
  email: string
  username: string
  first_name: string
  last_name: string
  password: string
  nrc_number: string
  phone_number: string
  address: string
  department: string
  employment_status: EmploymentStatus
  monthly_income: number
}

export interface MemberUpdateRequest {
  nrc_number?: string
  phone_number?: string
  address?: string
  department?: string
  employment_status?: EmploymentStatus
  monthly_income?: number
  membership_status?: MembershipStatus
  account_status?: AccountStatus
}
