import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/**
 * How UNZALARU uses members' data. Shown at signup, where members must agree
 * before registering (the proposal's "users will be informed about data usage").
 */
const SECTIONS = [
  {
    title: 'What we collect',
    body: 'Your name, email, phone number, MAN number, NRC number, school or faculty, department, address and employment status. As you use the system we also keep your loan applications, eligibility scores, approval decisions, repayments, payroll deductions and any arrears.',
  },
  {
    title: 'Why we use it',
    body: 'To check your membership, assess and decide on your loan applications, arrange monthly salary deductions with UNZA payroll, track your repayments and identify overdue payments.',
  },
  {
    title: 'Who can see it',
    body: 'Only UNZALARU administrators and supervisors who manage loans. Other members cannot see your information.',
  },
  {
    title: 'What we share',
    body: 'UNZA payroll receives only your MAN number, name and the amount to deduct each month. We do not share your information with anyone else or use it for marketing.',
  },
  {
    title: 'How we protect it',
    body: 'Your account is protected by your password, staff can only see what their role allows, and staff actions on loans and members are recorded in an audit log.',
  },
]

export function PrivacyNoticeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Privacy notice</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-1">
          <p className="text-muted-foreground">
            This explains how the UNZALARU Loan Management System uses the information you give us.
          </p>
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <p className="font-medium">{s.title}</p>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">{s.body}</p>
            </div>
          ))}
          <p className="text-muted-foreground">
            Questions about your data can be sent to a UNZALARU administrator.
          </p>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
