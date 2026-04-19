'use client'

export const dynamic = 'force-dynamic'

import { AppShell } from '@/components/layout/AppShell'
import { IssuesView } from '@/components/issues/IssuesView'
import { useAuth } from '@/lib/auth-context'

export default function MyIssuesPage() {
  const { user, isTechnician } = useAuth()

  return (
    <AppShell>
      <IssuesView
        filterByUser={user?.id}
        // Technicians see their assigned work orders; operators see issues they reported
        filterMode={isTechnician ? 'assigned' : 'reported'}
      />
    </AppShell>
  )
}
