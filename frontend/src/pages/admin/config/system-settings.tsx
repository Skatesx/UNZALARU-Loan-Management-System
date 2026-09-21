import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { PageHeader } from '@/components/shared/page-header'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, RotateCcw, Save } from 'lucide-react'

interface SystemConfigEntry {
  id: number
  key: string
  value: unknown
  description: string
}

export const CRITERIA_KEY = 'loan_approval_criteria'

interface CriteriaConfig {
  min_eligibility_score: number
  max_installment_income_ratio: number
  max_active_loans: number
  require_income_verification: boolean
  reject_if_any_overdue: boolean
  reject_if_defaulter: boolean
  require_active_membership: boolean
  min_membership_days: number
}

const CRITERIA_LABELS: Record<keyof CriteriaConfig, { label: string; hint: string }> = {
  min_eligibility_score: {
    label: 'Minimum eligibility score (0–100)',
    hint: 'Applications scoring below this are flagged.',
  },
  max_installment_income_ratio: {
    label: 'Max installment-to-income ratio',
    hint: 'e.g. 0.5 means the monthly installment may not exceed 50% of income.',
  },
  max_active_loans: {
    label: 'Max simultaneous active loans',
    hint: 'Cap per member across all loan types.',
  },
  require_income_verification: {
    label: 'Require income verification',
    hint: 'An admin must verify income before approval passes.',
  },
  reject_if_any_overdue: {
    label: 'Reject if any overdue installment',
    hint: 'Blocks approval when the member has overdue installments anywhere.',
  },
  reject_if_defaulter: {
    label: 'Reject defaulters',
    hint: 'Blocks members classified DEFAULTER or SEVERE_DEFAULTER.',
  },
  require_active_membership: {
    label: 'Require active membership',
    hint: 'Pending signups cannot borrow until approved.',
  },
  min_membership_days: {
    label: 'Minimum membership age (days)',
    hint: '0 disables the requirement.',
  },
}

const CRITERIA_ORDER: (keyof CriteriaConfig)[] = [
  'min_eligibility_score',
  'max_installment_income_ratio',
  'max_active_loans',
  'min_membership_days',
  'require_income_verification',
  'reject_if_any_overdue',
  'reject_if_defaulter',
  'require_active_membership',
]

function isCriteriaConfig(value: unknown): value is CriteriaConfig {
  if (typeof value !== 'object' || value === null) return false
  return 'min_eligibility_score' in (value as Record<string, unknown>)
}

export function SystemSettings() {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<Partial<CriteriaConfig>>({})

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['system-config'],
    queryFn: async () => {
      const response = await apiClient.get<SystemConfigEntry[]>('/admin/config/system/')
      return response.data
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (configs: { key: string; value: unknown; description?: string }[]) => {
      const response = await apiClient.put('/admin/config/system/', { configs })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] })
      toast.success('System settings saved')
    },
    onError: () => toast.error('Failed to save system settings'),
  })

  const criteriaEntry = data?.find((c) => c.key === CRITERIA_KEY)
  const criteria = isCriteriaConfig(criteriaEntry?.value) ? criteriaEntry.value : null

  useEffect(() => {
    if (criteria) setDraft({ ...criteria })
  }, [criteriaEntry?.value])

  if (isLoading) return <LoadingSkeleton type="form" />
  if (error) return <ErrorState message="Failed to load system settings" onRetry={() => refetch()} />

  const handleSave = () => {
    if (!criteriaEntry) {
      toast.error('No criteria configuration found')
      return
    }
    saveMutation.mutate([
      {
        key: CRITERIA_KEY,
        value: draft,
        description: criteriaEntry.description,
      },
    ])
  }

  const handleReset = () => {
    if (criteria) setDraft({ ...criteria })
    toast.info('Reverted unsaved changes')
  }

  const isDirty = criteria && JSON.stringify(draft) !== JSON.stringify(criteria)

  return (
    <div>
      <PageHeader
        title="System Settings"
        description="Configure loan approval criteria and system-wide behaviour"
        actions={
          <>
            <Button variant="outline" onClick={handleReset} disabled={!isDirty}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={!isDirty || saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save changes
            </Button>
          </>
        }
      />

      {!criteria ? (
        <Card>
          <CardHeader>
            <CardTitle>Loan Approval Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No criteria configuration found. Run the backend seed command
              (<code>python manage.py load_seed_data</code>) to create the
              defaults, or save any change below to initialize it.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {CRITERIA_ORDER.map((key) => {
                const meta = CRITERIA_LABELS[key]
                const isBool = typeof draft[key] === 'boolean'
                return (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={key}>{meta.label}</Label>
                    {isBool ? (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          id={key}
                          type="checkbox"
                          checked={Boolean(draft[key])}
                          onChange={(e) =>
                            setDraft({ ...draft, [key]: e.target.checked })
                          }
                        />
                        Enabled
                      </label>
                    ) : (
                      <Input
                        id={key}
                        type="number"
                        step="any"
                        value={String(draft[key] ?? '')}
                        onChange={(e) => {
                          const num = Number(e.target.value)
                          setDraft({ ...draft, [key]: Number.isNaN(num) ? 0 : num })
                        }}
                      />
                    )}
                    <p className="text-xs text-muted-foreground/70">{meta.hint}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loan Approval Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                These thresholds are evaluated automatically whenever an admin
                approves a loan application. A failed check blocks approval
                unless an override reason is supplied (audit-logged).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CRITERIA_ORDER.map((key) => {
                  const meta = CRITERIA_LABELS[key]
                  const isBool = typeof criteria[key] === 'boolean'
                  return (
                    <div key={key} className="space-y-1">
                      <Label htmlFor={key}>{meta.label}</Label>
                      {isBool ? (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            id={key}
                            type="checkbox"
                            checked={Boolean(draft[key])}
                            onChange={(e) =>
                              setDraft({ ...draft, [key]: e.target.checked })
                            }
                          />
                          Enabled
                        </label>
                      ) : (
                        <Input
                          id={key}
                          type="number"
                          step="any"
                          value={String(draft[key] ?? '')}
                          onChange={(e) => {
                            const num = Number(e.target.value)
                            setDraft({ ...draft, [key]: Number.isNaN(num) ? 0 : num })
                          }}
                        />
                      )}
                      <p className="text-xs text-muted-foreground/70">{meta.hint}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Other Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {data!.filter((c) => c.key !== CRITERIA_KEY).length === 0 ? (
                <p className="text-sm text-muted-foreground">No other configuration keys.</p>
              ) : (
                <div className="space-y-2">
                  {data!
                    .filter((c) => c.key !== CRITERIA_KEY)
                    .map((c) => (
                      <div
                        key={c.key}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                      >
                        <div>
                          <p className="text-sm font-medium">{c.key}</p>
                          {c.description && (
                            <p className="text-xs text-muted-foreground/70">{c.description}</p>
                          )}
                        </div>
                        <code className="text-xs bg-muted bg-muted rounded px-2 py-1">
                          {JSON.stringify(c.value)}
                        </code>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
