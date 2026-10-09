import { Skeleton } from '@/components/ui/skeleton'

interface LoadingSkeletonProps {
  type?: 'dashboard' | 'table' | 'detail' | 'form'
}

export function LoadingSkeleton({ type = 'dashboard' }: LoadingSkeletonProps) {
  if (type === 'dashboard') {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48 skeleton-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-28 rounded-lg skeleton-shimmer animate-rise"
              style={{ animationDelay: `${i * 45}ms` }}
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-64 rounded-lg skeleton-shimmer animate-rise"
              style={{ animationDelay: `${300 + i * 60}ms` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48 skeleton-shimmer" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64 skeleton-shimmer" />
          <Skeleton className="h-10 w-32 skeleton-shimmer" />
          <Skeleton className="h-10 w-32 skeleton-shimmer" />
        </div>
        <div className="border rounded-lg bg-card overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 border-b last:border-b-0 animate-rise"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Skeleton className="h-4 w-24 skeleton-shimmer" />
              <Skeleton className="h-4 w-32 skeleton-shimmer" />
              <Skeleton className="h-4 w-20 skeleton-shimmer" />
              <Skeleton className="h-4 w-28 skeleton-shimmer" />
              <Skeleton className="h-4 w-20 skeleton-shimmer" />
              <Skeleton className="h-6 w-16 rounded-full skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'detail') {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48 skeleton-shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-lg skeleton-shimmer animate-rise" />
            <Skeleton
              className="h-64 rounded-lg skeleton-shimmer animate-rise"
              style={{ animationDelay: '80ms' }}
            />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-lg skeleton-shimmer animate-rise" style={{ animationDelay: '120ms' }} />
            <Skeleton className="h-32 rounded-lg skeleton-shimmer animate-rise" style={{ animationDelay: '200ms' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <Skeleton className="h-8 w-48 skeleton-shimmer" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-12 w-full skeleton-shimmer animate-rise"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
