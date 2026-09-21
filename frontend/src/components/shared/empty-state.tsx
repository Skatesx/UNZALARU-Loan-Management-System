import type { ReactNode } from 'react'
import { FileX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed bg-card/50',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 ring-1 ring-foreground/5">
        {icon || <FileX className="w-6 h-6 text-muted-foreground/70" />}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
