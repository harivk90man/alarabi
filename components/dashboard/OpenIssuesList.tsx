'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { timeAgo } from '@/lib/format'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface IssueRow {
  id: string
  issue_number: string
  machine_id: string
  type: string
  description: string
  start_time: string
}

const typeVariant: Record<string, 'destructive' | 'warning' | 'info'> = {
  breakdown: 'destructive',
  minor: 'warning',
  preventive: 'info',
}

export function OpenIssuesList() {
  const [issues, setIssues] = useState<IssueRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('issues')
      .select('id, issue_number, machine_id, type, description, start_time')
      .eq('status', 'open')
      .order('start_time', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setIssues(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Open Issues</h2>
        <Link href="/issues" className="text-xs text-[#0d7a3e] hover:underline">
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p className="text-sm">No open issues</p>
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map(issue => (
            <div
              key={issue.id}
              className="flex items-start justify-between gap-3 p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-xs text-gray-500">{issue.issue_number}</span>
                  <Badge variant={typeVariant[issue.type] ?? 'outline'} className="text-[10px] px-1.5 py-0">
                    {issue.type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-800 truncate">{issue.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className="font-mono font-medium text-gray-600">{issue.machine_id}</span>
                  {' · '}
                  {timeAgo(issue.start_time)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
