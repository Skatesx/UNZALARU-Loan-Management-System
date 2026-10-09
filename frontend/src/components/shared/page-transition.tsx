import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Re-mounts and animates its children whenever `pageKey` changes — used with
 * the current route path to give every navigation a soft rise-in entrance.
 */
export function PageTransition({
  pageKey,
  className,
  children,
}: {
  pageKey: string
  className?: string
  children: ReactNode
}) {
  const [renderKey, setRenderKey] = useState(pageKey)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setRenderKey(pageKey)
  }, [pageKey])

  return (
    <div key={renderKey} className={cn('animate-page', className)}>
      {children}
    </div>
  )
}
