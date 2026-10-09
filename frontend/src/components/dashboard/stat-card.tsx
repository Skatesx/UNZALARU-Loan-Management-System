import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
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

/**
 * Animates a numeric value counting up from 0 on mount.
 * Non-numeric values (e.g. "K1,867,799.00") are kept as-is.
 */
function useCountUp(target: string | number, duration = 700): string | number {
  const [display, setDisplay] = useState(target)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (typeof target !== 'number' || !Number.isFinite(target)) {
      setDisplay(target)
      return
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setDisplay(target)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      setDisplay(Math.round(target * eased))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [target, duration])

  return display
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
  const animated = useCountUp(value)
  return (
    <Card
      className={cn(
        'group hover:ring-foreground/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-rise',
        styles.wrap,
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[13px] font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {animated}
            </p>
            {description && <p className="text-xs text-muted-foreground/80">{description}</p>}
            {trend && (
              <p
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md',
                  trend.isPositive
                    ? 'text-primary dark:text-emerald-400 bg-primary/5 dark:bg-emerald-400/10'
                    : 'text-red-600 dark:text-red-400 bg-red-500/5 dark:bg-red-400/10'
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
              'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3',
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
