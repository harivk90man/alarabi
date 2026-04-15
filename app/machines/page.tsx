'use client'

import { AppShell } from '@/components/layout/AppShell'
import { MachinesView } from '@/components/machines/MachinesView'

export default function MachinesPage() {
  return (
    <AppShell>
      <MachinesView />
    </AppShell>
  )
}
