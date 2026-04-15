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
  MACHINE_STATUS_CHANGED: '#0d7a3e',
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
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-500 text-sm mt-1">All system actions — newest first</p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {logs.length === 0 ? (
              <p className="text-center py-12 text-gray-400">No audit entries yet</p>
            ) : logs.map(log => (
              <div key={log.id} className="flex items-start gap-4 px-4 py-3 hover:bg-gray-50">
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
                    <span className="font-medium text-gray-800">
                      {(log.operator as { name: string } | null)?.name ?? 'System'}
                    </span>
                    {log.entity_type && (
                      <>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500 capitalize">{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="font-mono text-xs text-gray-400">{log.entity_id.substring(0, 8)}…</span>
                        )}
                      </>
                    )}
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="text-xs text-gray-400 font-mono mt-0.5 truncate">
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-xs font-mono text-gray-400 text-right whitespace-nowrap">
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
