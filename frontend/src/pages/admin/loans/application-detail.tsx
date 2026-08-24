import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useLoanApplication, useApproveLoanApplication, useRejectLoanApplication } from '@/hooks/use-loans'
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
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react'

export function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const applicationId = Number(id)

  const { data: application, isLoading, error, refetch } = useLoanApplication(applicationId)
  const approveMutation = useApproveLoanApplication()
  const rejectMutation = useRejectLoanApplication()

  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  if (isLoading) return <LoadingSkeleton type="detail" />
  if (error) return <ErrorState message="Failed to load application" onRetry={() => refetch()} />
  if (!application) return <ErrorState message="Application not found" />

  const canAct = application.status === 'PENDING' || application.status === 'UNDER_REVIEW'

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(applicationId)
      toast.success('Application approved successfully')
      refetch()
    } catch {
      toast.error('Failed to approve application')
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
                  <p className="text-xs text-gray-500">Loan Type</p>
                  <p className="text-sm font-medium">{application.loan_type_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Requested Amount</p>
                  <p className="text-sm font-bold text-emerald-600">
                    {formatCurrency(application.requested_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-medium">{application.duration_months} months</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Application ID</p>
                  <p className="text-sm font-medium">{application.application_id}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Purpose</p>
                <p className="text-sm">{application.purpose}</p>
              </div>
              {application.rejection_reason && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200">
                  <p className="text-xs text-red-500 font-medium mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700 dark:text-red-400">{application.rejection_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employment Info */}
          {application.current_employment_info && Object.keys(application.current_employment_info).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Employment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(application.current_employment_info, null, 2)}
                </pre>
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
                <p className="text-xs text-gray-500">Name</p>
                <Link
                  to={`/admin/members/${application.member?.id}`}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  {application.member?.full_name}
                </Link>
              </div>
              <div>
                <p className="text-xs text-gray-500">Member ID</p>
                <p className="text-sm font-medium">{application.member?.member_id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="text-sm">{application.member?.department}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {canAct && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!showReject ? (
                  <>
                    <Button
                      className="w-full"
                      onClick={handleApprove}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve Application
                    </Button>
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
                  <p className="text-xs text-gray-500">Reviewed By</p>
                  <p className="text-sm font-medium">{application.reviewed_by_name}</p>
                </div>
                {application.reviewed_at && (
                  <div>
                    <p className="text-xs text-gray-500">Reviewed At</p>
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
