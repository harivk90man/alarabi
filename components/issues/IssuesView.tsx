'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Plus, CheckCircle } from 'lucide-react'
import { timeAgo, formatDuration } from '@/lib/format'
import { logAudit } from '@/lib/audit'
import { useAuth } from '@/lib/auth-context'
import { LogIssueModal } from './LogIssueModal'

type TabFilter = 'all' | 'open' | 'in_progress' | 'resolved'

interface IssueRow {
  id: string
  issue_number: string
  machine_id: string
  type: string
  status: string
  description: string
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  downtime: boolean
  reported_by: string | null
  assigned_to: string | null
  resolution: string | null
  reporter?: { name: string } | null
  assignee?: { name: string } | null
}

const typeVariant: Record<string, 'destructive' | 'warning' | 'info'> = {
  breakdown: 'destructive',
  minor: 'warning',
  preventive: 'info',
}

const statusVariant: Record<string, 'destructive' | 'warning' | 'success' | 'outline'> = {
  open: 'destructive',
  in_progress: 'warning',
  resolved: 'success',
}

interface Props {
  filterByUser?: string
}

export function IssuesView({ filterByUser }: Props) {
  const [issues, setIssues] = useState<IssueRow[]>([])
  const [tab, setTab] = useState<TabFilter>('open')
  const [loading, setLoading] = useState(true)
  const [logOpen, setLogOpen] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const [resolutionText, setResolutionText] = useState('')
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const { user } = useAuth()

  async function fetchIssues() {
    let query = supabase
      .from('issues')
      .select(`
        id, issue_number, machine_id, type, status, description,
        start_time, end_time, duration_minutes, downtime,
        reported_by, assigned_to, resolution,
        reporter:operators!issues_reported_by_fkey(name),
        assignee:operators!issues_assigned_to_fkey(name)
      `)
      .order('start_time', { ascending: false })

    if (filterByUser) {
      query = query.or(`reported_by.eq.${filterByUser},assigned_to.eq.${filterByUser}`)
    }

    if (tab !== 'all') {
      query = query.eq('status', tab)
    }

    const { data } = await query.limit(100)
    setIssues((data ?? []) as unknown as IssueRow[])
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    fetchIssues()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filterByUser])

  const handleResolve = async (issueId: string) => {
    if (!resolutionText.trim()) return
    setResolvingId(issueId)

    await supabase.from('issues').update({
      status: 'resolved',
      end_time: new Date().toISOString(),
      resolution: resolutionText.trim(),
    }).eq('id', issueId)

    await logAudit(user?.id ?? '', 'ISSUE_RESOLVED', 'issue', issueId, {
      resolution: resolutionText.trim(),
    })

    setResolving(null)
    setResolutionText('')
    setResolvingId(null)
    fetchIssues()
  }

  const TABS: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {filterByUser ? 'My Issues' : 'Issues'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{issues.length} issues shown</p>
        </div>
        <Button onClick={() => setLogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Log Issue
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Issues list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle className="w-10 h-10 mx-auto mb-3" />
          <p>No issues found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map(issue => (
            <div
              key={issue.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-mono text-sm font-bold text-gray-700">{issue.issue_number}</span>
                    <span className="font-mono text-sm font-medium text-[#0d7a3e]">{issue.machine_id}</span>
                    <Badge variant={typeVariant[issue.type] ?? 'outline'} className="text-xs">
                      {issue.type}
                    </Badge>
                    <Badge variant={statusVariant[issue.status] ?? 'outline'} className="text-xs">
                      {issue.status.replace('_', ' ')}
                    </Badge>
                    {issue.downtime && (
                      <Badge variant="destructive" className="text-xs">DOWNTIME</Badge>
                    )}
                  </div>
                  <p className="text-gray-800 text-sm">{issue.description}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                    <span>Started: {timeAgo(issue.start_time)}</span>
                    {issue.end_time && (
                      <span>Duration: {formatDuration(issue.duration_minutes ?? 0)}</span>
                    )}
                    {issue.reporter && (
                      <span>By: <span className="font-medium">{(issue.reporter as { name: string }).name}</span></span>
                    )}
                    {issue.assignee && (
                      <span>Assigned: <span className="font-medium">{(issue.assignee as { name: string }).name}</span></span>
                    )}
                  </div>
                  {issue.resolution && (
                    <div className="mt-2 text-xs bg-green-50 border border-green-100 rounded px-2 py-1.5 text-green-700">
                      <span className="font-medium">Resolution:</span> {issue.resolution}
                    </div>
                  )}
                </div>

                {/* Resolve action */}
                {issue.status !== 'resolved' && (
                  <div className="flex-shrink-0">
                    {resolving === issue.id ? (
                      <div className="flex flex-col gap-2 w-52">
                        <Textarea
                          placeholder="Resolution notes..."
                          value={resolutionText}
                          onChange={e => setResolutionText(e.target.value)}
                          rows={2}
                          className="text-xs"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 text-xs h-7"
                            onClick={() => handleResolve(issue.id)}
                            disabled={!resolutionText.trim() || resolvingId === issue.id}
                          >
                            {resolvingId === issue.id ? '...' : 'Confirm'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => { setResolving(null); setResolutionText('') }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs gap-1 border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => setResolving(issue.id)}
                      >
                        <CheckCircle className="w-3 h-3" />
                        Resolve
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <LogIssueModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        reportedBy={user?.id ?? ''}
        onSuccess={() => {
          setLogOpen(false)
          fetchIssues()
        }}
      />
    </div>
  )
}
