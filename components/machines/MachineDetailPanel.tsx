'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import type { Machine } from '@/types/database'
import { timeAgo } from '@/lib/format'

type MachineWithCategory = Machine & { categories: { name: string } | null }

interface IssueRow {
  id: string
  issue_number: string
  type: string
  status: string
  description: string
  start_time: string
  end_time: string | null
  duration_minutes: number | null
}

interface Props {
  machine: MachineWithCategory
  onClose: () => void
  onLogIssue: () => void
}

const statusMap: Record<string, { label: string; color: string }> = {
  'Running': { label: 'Running', color: '#22c55e' },
  'Down': { label: 'Down', color: '#ef4444' },
  'Maintenance': { label: 'Maintenance', color: '#f59e0b' },
  'Minor Issue': { label: 'Minor Issue', color: '#3b82f6' },
}

const typeVariant: Record<string, 'destructive' | 'warning' | 'info'> = {
  breakdown: 'destructive',
  minor: 'warning',
  preventive: 'info',
}

export function MachineDetailPanel({ machine, onClose, onLogIssue }: Props) {
  const [issues, setIssues] = useState<IssueRow[]>([])

  useEffect(() => {
    supabase
      .from('issues')
      .select('id, issue_number, type, status, description, start_time, end_time, duration_minutes')
      .eq('machine_id', machine.id)
      .order('start_time', { ascending: false })
      .limit(8)
      .then(({ data }) => setIssues(data ?? []))
  }, [machine.id])

  const st = statusMap[machine.status] ?? statusMap['Running']

  return (
    <div
      className="w-80 xl:w-96 rounded-xl flex flex-col flex-shrink-0"
      style={{
        backgroundColor: 'var(--app-card)',
        boxShadow: '0 4px 16px -2px rgb(0 0 0 / 0.08), 0 1px 3px -1px rgb(0 0 0 / 0.06)',
      }}
    >
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--app-card-border)' }}>
        <div className="flex items-center gap-2.5">
          <span className="font-mono font-bold text-lg" style={{ color: 'var(--app-text)' }}>{machine.id}</span>
          <span
            className="px-2.5 py-1 rounded-lg text-xs text-white font-semibold"
            style={{ backgroundColor: st.color }}
          >
            {st.label}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="w-7 h-7">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-3 border-b text-sm" style={{ borderColor: 'var(--app-card-border)' }}>
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: 'var(--app-text-muted)' }}>Name</p>
          <p className="font-medium" style={{ color: 'var(--app-text)' }}>{machine.name}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: 'var(--app-text-muted)' }}>Model</p>
            <p className="font-mono text-xs" style={{ color: 'var(--app-text)' }}>{machine.model ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: 'var(--app-text-muted)' }}>Category</p>
            <p style={{ color: 'var(--app-text)' }}>{machine.categories?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: 'var(--app-text-muted)' }}>Manufacturer</p>
            <p style={{ color: 'var(--app-text)' }}>{machine.manufacturer ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--app-text)' }}>Recent Issues</h3>
          <Button size="sm" onClick={onLogIssue} className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" />
            Log Issue
          </Button>
        </div>

        {issues.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: 'var(--app-text-muted)' }}>No issues recorded</p>
        ) : (
          <div className="space-y-2">
            {issues.map(issue => (
              <div
                key={issue.id}
                className="p-2.5 rounded-lg text-xs transition-colors hover:bg-[var(--app-nav-hover)]"
                style={{ backgroundColor: 'var(--app-bg)' }}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono" style={{ color: 'var(--app-text-muted)' }}>{issue.issue_number}</span>
                  <div className="flex gap-1">
                    <Badge variant={typeVariant[issue.type] ?? 'outline'} className="text-[10px] px-1 py-0">
                      {issue.type}
                    </Badge>
                    <Badge
                      variant={issue.status === 'resolved' ? 'success' : 'destructive'}
                      className="text-[10px] px-1 py-0"
                    >
                      {issue.status}
                    </Badge>
                  </div>
                </div>
                <p className="line-clamp-2" style={{ color: 'var(--app-text)' }}>{issue.description}</p>
                <div className="mt-1 flex justify-between" style={{ color: 'var(--app-text-muted)' }}>
                  <span>{timeAgo(issue.start_time)}</span>
                  {issue.duration_minutes && (
                    <span>{Math.round(issue.duration_minutes)}m</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
