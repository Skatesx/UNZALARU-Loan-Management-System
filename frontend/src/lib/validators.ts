import { z } from 'zod'

// UNZA MAN (staff) number - same rule as the backend: exactly 6 digits
const manNumber = z
  .string()
  .trim()
  .min(1, 'MAN number is required')
  .regex(/^\d{6}$/, 'A MAN number is exactly 6 digits')

// Same format rules as the backend (members/serializers.py, users/validators.py)
const personName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^\p{L}+(?:[ '-]\p{L}+)*$/u, "Use letters only; spaces, hyphens (-) and apostrophes (') are allowed")

const nrcNumber = z
  .string()
  .trim()
  .min(1, 'NRC number is required')
  .regex(/^\d{6}\/\d{2}\/\d$/, 'Enter the NRC number as on the card, e.g. 123456/78/1')

const phoneNumber = z
  .string()
  .min(1, 'Phone number is required')
  .refine((v) => /^(?:\+260|0)\d{9}$/.test(v.replace(/[\s\-()]/g, '')), 'Enter a Zambian phone number, e.g. 0971234567 or +260971234567')

const groupName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((v) => !/\d/.test(v) && /\p{L}/u.test(v), 'Use the name in words, without numbers')

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  member_id: manNumber,
  first_name: personName('First name'),
  last_name: personName('Last name'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
  // Agreement to the privacy notice (how member data is used)
  consent: z.boolean().refine((v) => v === true, 'You must agree to the privacy notice to register'),
  nrc_number: nrcNumber,
  phone_number: phoneNumber,
  address: z.string().min(1, 'Address is required'),
  school: groupName('School / faculty'),
  department: groupName('Department'),
  employment_status: z.enum(['PERMANENT', 'CONTRACT', 'PART_TIME', 'RETIRED'], {
    errorMap: () => ({ message: 'Please select an employment status' }),
  }),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

export type SignupFormData = z.infer<typeof signupSchema>

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
  member_id: manNumber,
  email: z.string().email('Please enter a valid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  first_name: personName('First name'),
  last_name: personName('Last name'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  nrc_number: nrcNumber,
  phone_number: phoneNumber,
  address: z.string().min(1, 'Address is required'),
  school: groupName('School / faculty'),
  department: groupName('Department'),
  employment_status: z.enum(['PERMANENT', 'CONTRACT', 'PART_TIME', 'RETIRED'], {
    errorMap: () => ({ message: 'Please select an employment status' }),
  }),
})

export type MemberCreateFormData = z.infer<typeof memberCreateSchema>

export const loanApplicationSchema = z.object({
  // UNZALARU offers a single flat loan, filled in automatically
  loan_type: z.coerce.number().optional(),
  requested_amount: z.coerce.number().positive('Amount must be positive'),
  duration_months: z.coerce.number().int().positive('Duration must be positive'),
  purpose: z.string().min(10, 'Please provide more details about the purpose'),
})

export type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>

export const repaymentSchema = z.object({
  loan_id: z.string().min(1, 'Loan ID is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  payment_mode: z.enum(
    ['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHEQUE', 'SALARY_DEDUCTION', 'OTHER'],
    {
      errorMap: () => ({ message: 'Please select a payment mode' }),
    }
  ),
  schedule_id: z.string().optional(),
  notes: z.string().optional(),
})

export type RepaymentFormData = z.infer<typeof repaymentSchema>

export const rejectApplicationSchema = z.object({
  reason: z.string().min(5, 'Please provide a reason for rejection'),
})

export type RejectApplicationFormData = z.infer<typeof rejectApplicationSchema>
