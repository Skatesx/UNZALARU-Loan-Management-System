import { useEligibilityRules, useUpdateEligibilityRule } from '@/hooks/use-eligibility'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

export function EligibilityRuleConfig() {
  const { data: rules, isLoading, error, refetch } = useEligibilityRules()
  const updateRule = useUpdateEligibilityRule()

  if (isLoading) return <LoadingSkeleton type="table" />
  if (error) return <ErrorState message="Failed to load eligibility rules" onRetry={() => refetch()} />

  const rulesList = Array.isArray(rules) ? rules : []

  return (
    <div>
      <PageHeader
        title="Eligibility Rules"
        description="Configure scoring rules for loan eligibility"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rulesList.map((rule: any) => (
          <Card key={rule.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{rule.name}</CardTitle>
              <span className="text-sm font-bold text-primary">{rule.weight}%</span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Factor</span>
                <span className="font-medium">{rule.factor}</span>
              </div>
              <Progress value={Number(rule.weight)} className="h-2" />
              <div>
                <p className="text-xs text-muted-foreground/70 mb-2">Thresholds</p>
                <div className="space-y-1">
                  {rule.thresholds?.map((t: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-muted/50 px-3 py-1.5 rounded">
                      <span>K{t.min?.toLocaleString()} — {t.max ? `K${t.max.toLocaleString()}` : '∞'}</span>
                      <span className="font-medium">Score: {t.score}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-emerald-500' : 'bg-border'}`} />
                <span className="text-muted-foreground">{rule.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
