import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SystemSettings() {
  return (
    <div>
      <PageHeader title="System Settings" description="Configure system-wide settings" />

      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            System settings are configured through the backend. Contact an administrator to modify system configuration.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
