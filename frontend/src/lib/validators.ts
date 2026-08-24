import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const passwordChangeSchema = z.object({
  old_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>

export const memberCreateSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  nrc_number: z.string().min(1, 'NRC number is required'),
  phone_number: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  department: z.string().min(1, 'Department is required'),
  employment_status: z.enum(['PERMANENT', 'CONTRACT', 'PART_TIME', 'RETIRED'], {
    errorMap: () => ({ message: 'Please select an employment status' }),
  }),
  monthly_income: z.coerce.number().positive('Income must be positive'),
})

export type MemberCreateFormData = z.infer<typeof memberCreateSchema>

export const loanApplicationSchema = z.object({
  loan_type: z.coerce.number().positive('Please select a loan type'),
  requested_amount: z.coerce.number().positive('Amount must be positive'),
  duration_months: z.coerce.number().int().positive('Duration must be positive'),
  purpose: z.string().min(10, 'Please provide more details about the purpose'),
})

export type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>

export const repaymentSchema = z.object({
  loan_id: z.string().min(1, 'Loan ID is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  schedule_id: z.string().optional(),
  notes: z.string().optional(),
})

export type RepaymentFormData = z.infer<typeof repaymentSchema>

export const rejectApplicationSchema = z.object({
  reason: z.string().min(5, 'Please provide a reason for rejection'),
})

export type RejectApplicationFormData = z.infer<typeof rejectApplicationSchema>
