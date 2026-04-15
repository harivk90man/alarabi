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
  'Running': { label: 'Running', color: '#16a34a' },
  'Down': { label: 'Down', color: '#dc2626' },
  'Maintenance': { label: 'Maintenance', color: '#b45309' },
  'Minor Issue': { label: 'Minor Issue', color: '#1d4ed8' },
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
    <div className="w-80 xl:w-96 bg-white rounded-lg border border-gray-200 flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div>
          <span className="font-mono font-bold text-gray-900 text-lg">{machine.id}</span>
          <div
            className="inline-block ml-2 px-2 py-0.5 rounded-full text-xs text-white font-medium"
            style={{ backgroundColor: st.color }}
          >
            {st.label}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="w-7 h-7">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-3 border-b border-gray-100 text-sm">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Name</p>
          <p className="text-gray-800 font-medium">{machine.name}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Model</p>
            <p className="text-gray-700 font-mono text-xs">{machine.model ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Category</p>
            <p className="text-gray-700">{machine.categories?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Manufacturer</p>
            <p className="text-gray-700">{machine.manufacturer ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Recent Issues</h3>
          <Button size="sm" onClick={onLogIssue} className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" />
            Log Issue
          </Button>
        </div>

        {issues.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No issues recorded</p>
        ) : (
          <div className="space-y-2">
            {issues.map(issue => (
              <div key={issue.id} className="p-2.5 rounded-md bg-gray-50 text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-gray-500">{issue.issue_number}</span>
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
                <p className="text-gray-700 line-clamp-2">{issue.description}</p>
                <div className="text-gray-400 mt-1 flex justify-between">
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
