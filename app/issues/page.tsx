'use client'

export const dynamic = 'force-dynamic'

import { AppShell } from '@/components/layout/AppShell'
import { IssuesView } from '@/components/issues/IssuesView'

export default function IssuesPage() {
  return (
    <AppShell>
      <IssuesView />
    </AppShell>
  )
}
