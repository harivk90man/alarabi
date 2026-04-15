'use client'

import { AppShell } from '@/components/layout/AppShell'
import { IssuesView } from '@/components/issues/IssuesView'

export default function IssuesPage() {
  return (
    <AppShell>
      <IssuesView />
    </AppShell>
  )
}
