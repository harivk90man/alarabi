'use client'

export const dynamic = 'force-dynamic'

import { AppShell } from '@/components/layout/AppShell'
import { DashboardHeading } from '@/components/dashboard/DashboardHeading'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { FleetStatus } from '@/components/dashboard/FleetStatus'
import { DowntimeTrend } from '@/components/dashboard/DowntimeTrend'
import { CategoryHealth } from '@/components/dashboard/CategoryHealth'
import { OpenIssuesList } from '@/components/dashboard/OpenIssuesList'

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        {/* Command Center Hero */}
        <DashboardHeading />

        {/* KPI Cards Row */}
        <KpiCards />

        {/* Charts: Fleet Donut + Downtime Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <FleetStatus />
          </div>
          <div className="lg:col-span-3">
            <DowntimeTrend />
          </div>
        </div>

        {/* Bottom: Category Health + Active Issues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryHealth />
          <OpenIssuesList />
        </div>
      </div>
    </AppShell>
  )
}
