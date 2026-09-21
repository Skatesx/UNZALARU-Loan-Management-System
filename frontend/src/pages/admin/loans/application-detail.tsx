import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useLoanApplication, useLoanApprovalCriteria, useApproveLoanApplication, useRejectLoanApplication } from '@/hooks/use-loans'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { toast } from 'sonner'
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  ClipboardCheck,
} from 'lucide-react'

function CriteriaChecklist({
  applicationId,
}: {
  applicationId: number
}) {
  const {
    data: evaluation,
    isLoading,
    error,
  } = useLoanApprovalCriteria(applicationId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" /> Approval Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground/70">Evaluating criteria...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !evaluation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" /> Approval Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground/70">
            Criteria could not be evaluated.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" /> Approval Criteria
          </span>
          <StatusBadge status={evaluation.passed ? 'APPROVED' : 'REVIEW'} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {evaluation.results.map((criterion) => (
            <li key={criterion.key} className="flex items-start gap-3">
              {criterion.passed ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${
                    criterion.passed
                      ? 'text-foreground text-foreground'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {criterion.label}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {criterion.detail ||
                    `Value: ${String(criterion.value)} · Threshold: ${String(criterion.threshold)}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {!evaluation.passed && (
          <p className="mt-4 text-xs text-muted-foreground">
            Approval is blocked until these criteria pass or an administrator
            supplies an override reason (recorded in the audit log).
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const applicationId = Number(id)

  const { data: application, isLoading, error, refetch } = useLoanApplication(applicationId)
  const approveMutation = useApproveLoanApplication()
  const rejectMutation = useRejectLoanApplication()

  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showOverride, setShowOverride] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')

  if (isLoading) return <LoadingSkeleton type="detail" />
  if (error) return <ErrorState message="Failed to load application" onRetry={() => refetch()} />
  if (!application) return <ErrorState message="Application not found" />

  const canAct = application.status === 'PENDING' || application.status === 'UNDER_REVIEW'
  const eligibility = application.eligibility

  const handleApprove = async (overrideReason?: string) => {
    try {
      await approveMutation.mutateAsync({
        id: applicationId,
        overrideReason: overrideReason || undefined,
      })
      toast.success('Application approved successfully')
      setShowOverride(false)
      setOverrideReason('')
      refetch()
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      const message =
        axiosError.response?.data?.error || 'Failed to approve application'
      // Criteria failure — offer the override path
      if (message.toLowerCase().includes('criteria not met')) {
        setShowOverride(true)
        toast.error(message, { duration: 8000 })
      } else {
        toast.error(message)
      }
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    try {
      await rejectMutation.mutateAsync({ id: applicationId, data: { reason: rejectReason } })
      toast.success('Application rejected')
      setShowReject(false)
      setRejectReason('')
      refetch()
    } catch {
      toast.error('Failed to reject application')
    }
  }

  return (
    <div>
      <PageHeader
        title={`Application ${application.application_id}`}
        description={`Submitted on ${formatDateTime(application.application_date)}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={application.status} />
            <Link to="/admin/loans/applications">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Application Info */}
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Loan Type</p>
                  <p className="text-sm font-medium">{application.loan_type_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Requested Amount</p>
                  <p className="text-sm font-bold text-primary">
                    {formatCurrency(application.requested_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">{application.duration_months} months</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Application ID</p>
                  <p className="text-sm font-medium">{application.application_id}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Purpose</p>
                <p className="text-sm">{application.purpose}</p>
              </div>
              {application.rejection_reason && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200">
                  <p className="text-xs text-destructive font-medium mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700 dark:text-red-400">{application.rejection_reason}</p>
                </div>
              )}
              {Boolean(application.income_info?.['criteria_override_reason']) && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
                  <p className="text-xs text-amber-600 font-medium mb-1">
                    Criteria Override
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    {String(application.income_info?.['criteria_override_reason'] ?? '')}
                    {application.income_info?.['criteria_override_by']
                      ? ` — by ${String(application.income_info['criteria_override_by'])}`
                      : ''}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Eligibility */}
          {eligibility && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Eligibility Assessment</span>
                  <StatusBadge status={eligibility.recommendation} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-primary">
                    {Math.round(eligibility.total_score)}
                  </div>
                  <div className="text-xs text-muted-foreground/70">/ 100 weighted score</div>
                </div>
                {eligibility.reasons?.length > 0 && (
                  <ul className="text-sm space-y-1">
                    {eligibility.reasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {/* Employment Info */}
          {application.current_employment_info && Object.keys(application.current_employment_info).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Employment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                  {Object.entries(application.current_employment_info).map(([key, value]) => (
                    <div key={key} className="min-w-0">
                      <dt className="text-xs text-muted-foreground">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </dt>
                      <dd className="text-sm font-medium text-foreground break-words">
                        {String(value ?? '—')}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Member Info */}
          <Card>
            <CardHeader>
              <CardTitle>Applicant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <Link
                  to={`/admin/members/${application.member?.id}`}
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  {application.member?.full_name}
                </Link>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Member ID</p>
                <p className="text-sm font-medium">{application.member?.member_id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm">{application.member?.department}</p>
              </div>
            </CardContent>
          </Card>

          {/* Approval Criteria Checklist */}
          <CriteriaChecklist applicationId={applicationId} />

          {/* Actions */}
          {canAct && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!showReject ? (
                  <>
                    {!showOverride ? (
                      <Button
                        className="w-full"
                        onClick={() => handleApprove()}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Approve Application
                      </Button>
                    ) : (
                      <div className="space-y-2 border border-amber-200 dark:border-amber-800 rounded-lg p-3 bg-amber-50 dark:bg-amber-950/30">
                        <Label className="text-xs text-amber-700 dark:text-amber-400">
                          Override reason (required to approve despite failed
                          criteria; recorded in audit log)
                        </Label>
                        <Textarea
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          placeholder="e.g. Chairperson approved exception..."
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            disabled={
                              approveMutation.isPending ||
                              overrideReason.trim().length < 5
                            }
                            onClick={() => handleApprove(overrideReason.trim())}
                          >
                            {approveMutation.isPending && (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Override & Approve
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowOverride(false)
                              setOverrideReason('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setShowReject(true)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Application
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Rejection Reason *</Label>
                      <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Provide a reason for rejection..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={rejectMutation.isPending}
                        className="flex-1"
                      >
                        {rejectMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Confirm Reject
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowReject(false)
                          setRejectReason('')
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Review Info */}
          {application.reviewed_by_name && (
            <Card>
              <CardHeader>
                <CardTitle>Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Reviewed By</p>
                  <p className="text-sm font-medium">{application.reviewed_by_name}</p>
                </div>
                {application.reviewed_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">Reviewed At</p>
                    <p className="text-sm">{formatDateTime(application.reviewed_at)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
