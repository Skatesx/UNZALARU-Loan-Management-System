import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

type StatCardTone = 'brand' | 'info' | 'warning' | 'danger' | 'neutral'

const toneStyles: Record<StatCardTone, { wrap: string; icon: string }> = {
  brand: {
    wrap: 'ring-foreground/10',
    icon: 'bg-primary/10 text-primary dark:bg-primary/15',
  },
  info: {
    wrap: 'ring-foreground/10',
    icon: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
  },
  warning: {
    wrap: 'ring-foreground/10',
    icon: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
  },
  danger: {
    wrap: 'ring-destructive/20',
    icon: 'bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  },
  neutral: {
    wrap: 'ring-foreground/10',
    icon: 'bg-muted text-muted-foreground',
  },
}

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  description?: string
  className?: string
  tone?: StatCardTone
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatCard({
  title,
  value,
  icon,
  description,
  className,
  tone = 'brand',
  trend,
}: StatCardProps) {
  const styles = toneStyles[tone]
  return (
    <Card
      className={cn(
        'group hover:ring-foreground/20 hover:shadow-sm transition-all',
        styles.wrap,
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[13px] font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {value}
            </p>
            {description && <p className="text-xs text-muted-foreground/80">{description}</p>}
            {trend && (
              <p
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium',
                  trend.isPositive ? 'text-primary dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105',
              styles.icon
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
