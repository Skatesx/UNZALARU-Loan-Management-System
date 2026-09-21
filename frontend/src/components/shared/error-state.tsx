import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4 ring-1 ring-destructive/20">
        <AlertCircle className="w-6 h-6 text-destructive" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">Something went wrong</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try again
        </Button>
      )}
    </div>
  )
}
