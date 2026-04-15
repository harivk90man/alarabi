'use client'

export const dynamic = 'force-dynamic'

import { AppShell } from '@/components/layout/AppShell'
import { ReportsView } from '@/components/reports/ReportsView'

export default function ReportsPage() {
  return (
    <AppShell>
      <ReportsView />
    </AppShell>
  )
}
