'use client'

export const dynamic = 'force-dynamic'

import { AppShell } from '@/components/layout/AppShell'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { CategoryHealth } from '@/components/dashboard/CategoryHealth'
import { OpenIssuesList } from '@/components/dashboard/OpenIssuesList'
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts'

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Factory operations overview</p>
        </div>

        <KpiCards />
        <CategoryHealth />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OpenIssuesList />
          <LowStockAlerts />
        </div>
      </div>
    </AppShell>
  )
}
