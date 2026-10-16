import type { User } from './auth'

export type EmploymentStatus = 'PERMANENT' | 'CONTRACT' | 'PART_TIME' | 'RETIRED'
export type MembershipStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
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
  membership_status: MembershipStatus
  approved_by: number | null
  approval_date: string | null
  account_status: AccountStatus
  /** Loan applications made by the member (cancelled ones excluded) */
  application_count: number
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
  membership_status: MembershipStatus
  account_status: AccountStatus
  application_count: number
  created_at: string
}

export interface MemberCreateRequest {
  /** MAN number */
  member_id: string
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
}

export interface MemberSignupRequest {
  /** MAN number */
  member_id: string
  email: string
  first_name: string
  last_name: string
  password: string
  nrc_number: string
  phone_number: string
  address: string
  department: string
  employment_status: EmploymentStatus
}

export interface MemberSignupResponse {
  message: string
  member_id: string
  membership_status: MembershipStatus
}

export interface MemberUpdateRequest {
  nrc_number?: string
  phone_number?: string
  address?: string
  department?: string
  employment_status?: EmploymentStatus
  membership_status?: MembershipStatus
  account_status?: AccountStatus
}
