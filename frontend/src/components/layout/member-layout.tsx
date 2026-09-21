import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { PendingMemberBanner } from '@/components/shared/pending-member-banner'

export function MemberLayout() {
  return (
    <div className="flex min-h-screen bg-muted/50 bg-background">
      <Sidebar role="MEMBER" />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <PendingMemberBanner />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
