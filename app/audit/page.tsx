'use client'

export const dynamic = 'force-dynamic'

import { AppShell } from '@/components/layout/AppShell'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/format'

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
  ISSUE_CREATED: '#1d4ed8',
  ISSUE_RESOLVED: '#16a34a',
  PART_USED: '#b45309',
  PART_STOCK_UPDATED: '#7c3aed',
  MACHINE_STATUS_CHANGED: '#1d4ed8',
  OPERATOR_LOGIN: '#374151',
  OPERATOR_LOGOUT: '#6b7280',
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
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--app-text)' }}>Audit Log</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>All system actions — newest first</p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--app-nav-hover)' }} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)' }}>
            {logs.length === 0 ? (
              <p className="text-center py-12" style={{ color: 'var(--app-text-muted)' }}>No audit entries yet</p>
            ) : logs.map(log => (
              <div key={log.id} className="flex items-start gap-4 px-4 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--app-card-border)' }}>
                <div className="flex-shrink-0 mt-0.5">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs font-mono font-medium text-white"
                    style={{ backgroundColor: actionColors[log.action] ?? '#374151' }}
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
                        <span style={{ color: 'var(--app-text-muted)' }}>·</span>
                        <span className="capitalize" style={{ color: 'var(--app-text-muted)' }}>{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="font-mono text-xs" style={{ color: 'var(--app-text-muted)' }}>{log.entity_id.substring(0, 8)}…</span>
                        )}
                      </>
                    )}
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="text-xs font-mono mt-0.5 truncate" style={{ color: 'var(--app-text-muted)' }}>
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
