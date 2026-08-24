import { useEligibilityReport } from '@/hooks/use-reports'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Progress } from '@/components/ui/progress'

export function EligibilityReport() {
  const { data, isLoading, error, refetch } = useEligibilityReport()

  if (isLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load eligibility report" onRetry={() => refetch()} />

  const report = data || []

  return (
    <div>
      <PageHeader title="Eligibility Report" description={`${report.length} records`} />

      {report.length === 0 ? (
        <EmptyState title="No data" description="No eligibility records found." />
      ) : (
        <div className="border rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Member</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Application</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Recommendation</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Decision</th>
                </tr>
              </thead>
              <tbody>
                {report.map((r: any, idx: number) => (
                  <tr key={idx} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{r.member_name}</p>
                        <p className="text-xs text-gray-500">{r.member_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{r.application_id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={r.eligibility_score} className="w-20 h-2" />
                        <span className="font-medium">{r.eligibility_score}/100</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.recommendation} /></td>
                    <td className="px-4 py-3"><StatusBadge status={r.final_decision} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
