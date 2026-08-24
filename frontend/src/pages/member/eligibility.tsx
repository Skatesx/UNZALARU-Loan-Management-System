import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function Eligibility() {
  // This page would show eligibility scores from past applications
  // For now, show a placeholder since the member can view scores from application details
  return (
    <div>
      <PageHeader
        title="Eligibility"
        description="Your loan eligibility scores"
      />

      <Card>
        <CardContent className="p-8">
          <EmptyState
            title="Eligibility Scores"
            description="Your eligibility scores are displayed on each loan application. Submit a loan application to see your eligibility score breakdown."
          />
        </CardContent>
      </Card>
    </div>
  )
}
