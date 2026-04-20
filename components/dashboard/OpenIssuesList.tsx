'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { timeAgo } from '@/lib/format'
import { CheckCircle, ArrowRight, Clock, User, AlertTriangle } from 'lucide-react'
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

function priorityScore(issue: IssueRow): number {
  let score = 0
  if (issue.type === 'breakdown') score += 100
  if (issue.downtime) score += 50
  if (issue.status === 'open') score += 20
  score += (Date.now() - new Date(issue.start_time).getTime()) / 60000
  return score
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
      .limit(8)
      .then(({ data }) => {
        const sorted = ((data ?? []) as unknown as IssueRow[])
          .sort((a, b) => priorityScore(b) - priorityScore(a))
        setIssues(sorted)
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
    <div
      className="rounded-xl p-6"
      style={{
        backgroundColor: 'var(--app-card)',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--app-text)' }}>
              Active Issues
            </h2>
            {!loading && issues.length > 0 && (
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums"
                style={{ backgroundColor: '#ef444418', color: '#ef4444' }}
              >
                {issues.length}
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-muted)' }}>
            Priority-sorted open & in-progress
          </p>
        </div>
        <Link
          href="/issues"
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80 hover:gap-2"
          style={{ color: 'var(--brand-accent)', backgroundColor: 'var(--brand-accent)' + '10' }}
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] rounded-lg animate-pulse"
              style={{ backgroundColor: 'var(--app-nav-hover)' }}
            />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12 rounded-lg"
          style={{ backgroundColor: 'var(--app-nav-hover)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ backgroundColor: '#22c55e15' }}
          >
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--app-text)' }}>All clear</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-muted)' }}>No active issues right now</p>
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map((issue, idx) => {
            const hasDesc = !!issue.description
            const isOpen = issue.status === 'open'
            const isBreakdown = issue.type === 'breakdown'
            const statusColor = isOpen ? '#ef4444' : '#f59e0b'

            return (
              <div
                key={issue.id}
                className="flex items-start gap-3 p-3.5 rounded-lg transition-all duration-200 hover:translate-x-0.5 animate-in fade-in slide-in-from-bottom-2 duration-400 [animation-fill-mode:backwards] group"
                style={{
                  backgroundColor: 'var(--app-bg)',
                  borderLeft: `3px solid ${statusColor}`,
                  animationDelay: `${idx * 50}ms`,
                }}
              >
                {/* Priority indicator */}
                <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
                  {isBreakdown ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColor }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--app-text)' }}>
                      {issue.issue_number}
                    </span>
                    <span
                      className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded"
                      style={{ color: 'var(--brand-accent)', backgroundColor: 'var(--brand-accent)' + '12' }}
                    >
                      {issue.machine_id}
                    </span>
                    <Badge variant={statusVariant[issue.status] ?? 'outline'} className="text-[10px] px-1.5 py-0">
                      {issue.status.replace('_', ' ')}
                    </Badge>
                    {hasDesc && (
                      <Badge variant={typeVariant[issue.type] ?? 'outline'} className="text-[10px] px-1.5 py-0">
                        {issue.type}
                      </Badge>
                    )}
                    {issue.downtime && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 animate-pulse">
                        DOWNTIME
                      </span>
                    )}
                  </div>

                  <p className="text-xs mt-1 truncate" style={{ color: hasDesc ? 'var(--app-text)' : 'var(--app-text-muted)' }}>
                    {hasDesc ? issue.description : 'Awaiting technician assessment'}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 text-[11px]" style={{ color: 'var(--app-text-muted)' }}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(issue.start_time)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {issue.assignee
                        ? <span className="font-medium" style={{ color: 'var(--brand-accent)' }}>{(issue.assignee as any).name}</span>
                        : <span className="text-amber-500 font-medium">Unassigned</span>
                      }
                    </span>
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
