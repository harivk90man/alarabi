'use client'

export const dynamic = 'force-dynamic'

import { AppShell } from '@/components/layout/AppShell'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/format'
import { ScrollText } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'

interface AuditRow {
  id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  operator?: { name: string } | null
}

const actionColors: Record<string, string> = {
  ISSUE_CREATED: '#3b82f6',
  ISSUE_RESOLVED: '#22c55e',
  ISSUE_ASSIGNED: '#8b5cf6',
  ISSUE_UPDATED: '#f59e0b',
  PART_USED: '#f59e0b',
  PART_STOCK_UPDATED: '#8b5cf6',
  MACHINE_STATUS_CHANGED: '#3b82f6',
  OPERATOR_LOGIN: '#6b7280',
  OPERATOR_LOGOUT: '#9ca3af',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('audit_log')
      .select('*, operator:operators(name)')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setLogs((data ?? []) as AuditRow[])
        setLoading(false)
      })
  }, [])

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader icon={ScrollText} title="Audit Log" subtitle="All system actions — newest first" />

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--app-card)' }} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'var(--app-card)',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
            }}
          >
            {logs.length === 0 ? (
              <p className="text-center py-12" style={{ color: 'var(--app-text-muted)' }}>No audit entries yet</p>
            ) : logs.map(log => (
              <div
                key={log.id}
                className="flex items-start gap-4 px-5 py-3.5 border-b last:border-b-0 transition-colors hover:bg-[var(--app-nav-hover)]"
                style={{ borderColor: 'var(--app-card-border)' }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <span
                    className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold text-white"
                    style={{ backgroundColor: actionColors[log.action] ?? '#6b7280' }}
                  >
                    {log.action}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium" style={{ color: 'var(--app-text)' }}>
                      {(log.operator as { name: string } | null)?.name ?? 'System'}
                    </span>
                    {log.entity_type && (
                      <>
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--app-text-muted)' }} />
                        <span className="capitalize text-xs" style={{ color: 'var(--app-text-muted)' }}>{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ color: 'var(--app-text-muted)', backgroundColor: 'var(--app-nav-hover)' }}>
                            {log.entity_id.substring(0, 8)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="text-xs font-mono mt-1 truncate" style={{ color: 'var(--app-text-muted)' }}>
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-xs font-mono text-right whitespace-nowrap" style={{ color: 'var(--app-text-muted)' }}>
                  {formatDateTime(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
