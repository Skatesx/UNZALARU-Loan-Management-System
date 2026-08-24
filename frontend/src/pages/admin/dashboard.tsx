import { useAdminDashboardSummary, useAdminDashboardChart } from '@/hooks/use-dashboard'
import { StatCard } from '@/components/dashboard/stat-card'
import { ChartCard } from '@/components/dashboard/chart-card'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { formatCurrency, formatNumber } from '@/lib/formatters'
import {
  Users,
  FileText,
  CheckCircle,
  Activity,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  XCircle,
  AlertOctagon,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export function AdminDashboard() {
  const { data: summary, isLoading, error, refetch } = useAdminDashboardSummary()
  const { data: loansOverTime } = useAdminDashboardChart('loans-over-time')
  const { data: repaymentsOverTime } = useAdminDashboardChart('repayments-over-time')
  const { data: loanStatusDist } = useAdminDashboardChart('loan-status-distribution')
  const { data: applicationDist } = useAdminDashboardChart('application-distribution')
  const { data: defaulterDist } = useAdminDashboardChart('defaulters-by-classification')
  const { data: outstandingAmounts } = useAdminDashboardChart('outstanding-amounts')

  if (isLoading) return <LoadingSkeleton type="dashboard" />
  if (error) return <ErrorState message="Failed to load dashboard data" onRetry={() => refetch()} />

  const formatMonth = (v: string) => {
    if (!v) return ''
    try {
      return new Date(v).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    } catch {
      return v
    }
  }

  const formatTooltipDate = (v: string) => {
    if (!v) return ''
    try {
      return new Date(v).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    } catch {
      return v
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Overview of the UNZALARU loan management system
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Members" value={formatNumber(summary?.total_members || 0)} icon={<Users className="w-5 h-5" />} />
        <StatCard title="Pending Applications" value={formatNumber(summary?.pending_applications || 0)} icon={<FileText className="w-5 h-5" />} />
        <StatCard title="Active Loans" value={formatNumber(summary?.active_loans || 0)} icon={<Activity className="w-5 h-5" />} />
        <StatCard title="Total Loaned" value={formatCurrency(summary?.total_amount_loaned || 0)} icon={<DollarSign className="w-5 h-5" />} />
        <StatCard title="Total Repaid" value={formatCurrency(summary?.total_amount_repaid || 0)} icon={<TrendingUp className="w-5 h-5" />} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Outstanding Balance" value={formatCurrency(summary?.outstanding_balance || 0)} icon={<AlertTriangle className="w-5 h-5" />} />
        <StatCard title="Approved Loans" value={formatNumber(summary?.approved_loans || 0)} icon={<CheckCircle className="w-5 h-5" />} />
        <StatCard title="At Risk" value={formatNumber(summary?.at_risk_borrowers || 0)} icon={<AlertCircle className="w-5 h-5" />} />
        <StatCard title="Defaulters" value={formatNumber(summary?.defaulters || 0)} icon={<XCircle className="w-5 h-5" />} />
        <StatCard title="Severe Defaulters" value={formatNumber(summary?.severe_defaulters || 0)} icon={<AlertOctagon className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Loans Issued Over Time">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={(loansOverTime || []) as any[]}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tickFormatter={(v: any) => formatMonth(String(v))} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip labelFormatter={(v: any) => formatTooltipDate(String(v))} />
              <Area type="monotone" dataKey="count" stroke="#10B981" fill="#10B981" fillOpacity={0.2} name="Loans" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Repayments Over Time">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={(repaymentsOverTime || []) as any[]}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tickFormatter={(v: any) => formatMonth(String(v))} fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip labelFormatter={(v: any) => formatTooltipDate(String(v))} formatter={(value: any) => [`K${Number(value).toLocaleString()}`, 'Amount']} />
              <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="Amount" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Loan Status Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={(loanStatusDist || []) as any[]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="count"
                nameKey="status"
                label={({ status, count }: any) => `${status}: ${count}`}
              >
                {(loanStatusDist || []).map((_: unknown, index: number) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Application Status Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={(applicationDist || []) as any[]}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="status" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} name="Applications" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Defaulters by Classification">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={(defaulterDist || []) as any[]} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="classification" type="category" fontSize={12} width={120} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Members">
                {(defaulterDist || []).map((entry: any, index: number) => (
                  <Cell
                    key={index}
                    fill={
                      entry.classification === 'SEVERE_DEFAULTER' ? '#991B1B' :
                      entry.classification === 'DEFAULTER' ? '#EF4444' :
                      entry.classification === 'AT_RISK' ? '#F97316' : '#10B981'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Outstanding Amounts by Loan Type">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={(outstandingAmounts || []) as any[]}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="loan_type__name" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v: any) => `K${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: any) => [`K${Number(value).toLocaleString()}`, 'Outstanding']} />
              <Bar dataKey="total" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Outstanding" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
