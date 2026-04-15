'use client'

import { AppShell } from '@/components/layout/AppShell'
import { IssuesView } from '@/components/issues/IssuesView'
import { useAuth } from '@/lib/auth-context'

export default function MyIssuesPage() {
  const { user } = useAuth()

  return (
    <AppShell>
      <IssuesView filterByUser={user?.id} />
    </AppShell>
  )
}
