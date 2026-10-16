import { NavLink } from 'react-router-dom'
import { useStaffBase } from '@/hooks/use-auth'

const REPORTS = [
  { label: 'Loans', path: 'loans' },
  { label: 'Repayments', path: 'repayments' },
  { label: 'Defaulters', path: 'defaulters' },
  { label: 'Eligibility', path: 'eligibility' },
  { label: 'Membership', path: 'membership' },
]

/** Links between the report pages (the sidebar only opens the first one). */
export function ReportTabs() {
  const staffBase = useStaffBase()
  return (
    <nav aria-label="Reports" className="mb-6 flex flex-wrap gap-1 border-b">
      {REPORTS.map((report) => (
        <NavLink
          key={report.path}
          to={`${staffBase}/reports/${report.path}`}
          className={({ isActive }) =>
            `-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`
          }
        >
          {report.label}
        </NavLink>
      ))}
    </nav>
  )
}
