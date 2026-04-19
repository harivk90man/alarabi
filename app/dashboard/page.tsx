'use client'

export const dynamic = 'force-dynamic'

import { AppShell } from '@/components/layout/AppShell'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { CategoryHealth } from '@/components/dashboard/CategoryHealth'
import { OpenIssuesList } from '@/components/dashboard/OpenIssuesList'
import { DashboardHeading } from '@/components/dashboard/DashboardHeading'

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <DashboardHeading />
        <KpiCards />
        <CategoryHealth />
        <OpenIssuesList />
      </div>
    </AppShell>
  )
}
