'use client'

import { useLanguage } from '@/lib/language-context'

export function DashboardHeading() {
  const { t } = useLanguage()
  return (
    <div>
      <h1 className="text-2xl font-bold" style={{ color: 'var(--app-text)' }}>{t('dashboardTitle')}</h1>
      <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>Factory operations overview</p>
    </div>
  )
}
