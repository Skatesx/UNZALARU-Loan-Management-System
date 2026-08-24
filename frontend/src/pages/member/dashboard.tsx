import { useMemberDashboard } from '@/hooks/use-dashboard'
import { useAuth } from '@/hooks/use-auth'
import { StatCard } from '@/components/dashboard/stat-card'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Award, CreditCard, AlertTriangle, Calendar, HandCoins } from 'lucide-react'

export function MemberDashboard() {
  const { user } = useAuth()
  const { data, isLoading, error, refetch } = useMemberDashboard()

  if (isLoading) return <LoadingSkeleton type="dashboard" />
  if (error) return <ErrorState message="Failed to load dashboard" onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Welcome, {user?.first_name}!
        </h1>
        <p className="text-sm text-gray-500">Here's an overview of your account</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Eligibility Score"
          value={data?.eligibility_score ? `${data.eligibility_score}/100` : 'N/A'}
          icon={<Award className="w-5 h-5" />}
        />
        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(data?.outstanding_balance || 0)}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard
          title="Next Payment"
          value={data?.next_payment ? formatCurrency(data.next_payment.amount) : 'No payment due'}
          icon={<Calendar className="w-5 h-5" />}
          description={data?.next_payment ? `Due: ${new Date(data.next_payment.due_date).toLocaleDateString()}` : undefined}
        />
        <StatCard
          title="Borrower Status"
          value={data?.borrower_status || 'N/A'}
          icon={<CreditCard className="w-5 h-5" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/member/apply-loan">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <HandCoins className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium">Apply for Loan</p>
                <p className="text-xs text-gray-500">Submit a new loan application</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/member/my-loans">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">View My Loans</p>
                <p className="text-xs text-gray-500">Check your active loans</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/member/repayment-history">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Repayment History</p>
                <p className="text-xs text-gray-500">View your payment history</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Current Loan */}
      {data?.current_loan && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Current Active Loan</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Loan ID</p>
                <p className="font-medium text-emerald-600">{data.current_loan.loan_id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Principal</p>
                <p className="font-medium">{formatCurrency(data.current_loan.principal)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Monthly Installment</p>
                <p className="font-medium">{formatCurrency(data.current_loan.monthly_installment)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Outstanding</p>
                <p className="font-medium text-amber-600">{formatCurrency(data.current_loan.outstanding_balance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
