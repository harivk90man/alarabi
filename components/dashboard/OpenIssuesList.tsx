'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { timeAgo } from '@/lib/format'
import { AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface IssueRow {
  id: string
  issue_number: string
  machine_id: string
  type: string
  status: string
  description: string
  start_time: string
  downtime: boolean
  assignee: { name: string } | null
}

const typeVariant: Record<string, 'destructive' | 'warning' | 'info'> = {
  breakdown: 'destructive',
  minor: 'warning',
  preventive: 'info',
}
const statusVariant: Record<string, 'destructive' | 'warning' | 'success' | 'outline'> = {
  open: 'destructive', in_progress: 'warning', resolved: 'success',
}

export function OpenIssuesList() {
  const [issues, setIssues] = useState<IssueRow[]>([])
  const [loading, setLoading] = useState(true)

  function fetchIssues() {
    supabase
      .from('issues')
      .select(`
        id, issue_number, machine_id, type, status, description, start_time, downtime,
        assignee:operators!issues_assigned_to_fkey(name)
      `)
      .in('status', ['open', 'in_progress'])
      .order('start_time', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setIssues((data ?? []) as unknown as IssueRow[])
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchIssues()

    const channel = supabase
      .channel('dashboard-open-issues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, fetchIssues)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-lg border p-5"
      style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold" style={{ color: 'var(--app-text)' }}>
          Open &amp; In-Progress Issues
          {!loading && issues.length > 0 && (
            <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-red-100 text-red-600">
              {issues.length}
            </span>
          )}
        </h2>
        <Link href="/issues" className="text-xs text-[#1d4ed8] hover:underline">
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10" style={{ color: 'var(--app-text-muted)' }}>
          <CheckCircle className="w-9 h-9 mb-2 text-green-500" />
          <p className="text-sm">All clear — no open issues</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {issues.map(issue => {
            const hasAssessment = !!issue.description
            return (
              <div key={issue.id}
                className="flex items-start gap-3 p-3 rounded-lg border transition-colors"
                style={{ borderColor: 'var(--app-card-border)', backgroundColor: 'var(--app-bg)' }}>

                <AlertCircle
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: issue.status === 'in_progress' ? '#b45309' : '#dc2626' }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--app-text-muted)' }}>
                      {issue.issue_number}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#1d4ed8]">
                      {issue.machine_id}
                    </span>
                    <Badge variant={statusVariant[issue.status] ?? 'outline'} className="text-[10px] px-1.5 py-0">
                      {issue.status.replace('_', ' ')}
                    </Badge>
                    {hasAssessment && (
                      <Badge variant={typeVariant[issue.type] ?? 'outline'} className="text-[10px] px-1.5 py-0">
                        {issue.type}
                      </Badge>
                    )}
                    {issue.downtime && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">
                        DOWNTIME
                      </span>
                    )}
                  </div>

                  <p className="text-xs truncate" style={{ color: hasAssessment ? 'var(--app-text)' : 'var(--app-text-muted)' }}>
                    {hasAssessment ? issue.description : 'Awaiting technician assessment'}
                  </p>

                  <div className="flex items-center gap-2 mt-1 text-[11px]" style={{ color: 'var(--app-text-muted)' }}>
                    <span>{timeAgo(issue.start_time)}</span>
                    {issue.assignee
                      ? <span className="text-[#1d4ed8] font-medium">· {(issue.assignee as any).name}</span>
                      : <span className="text-amber-500 font-medium">· Unassigned</span>
                    }
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
