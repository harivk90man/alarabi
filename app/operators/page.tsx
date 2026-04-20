'use client'

export const dynamic = 'force-dynamic'

import { AppShell } from '@/components/layout/AppShell'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import type { Operator } from '@/types/database'

interface OperatorStats extends Operator {
  resolved_count: number
  open_count: number
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<OperatorStats[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [opsRes, issuesRes] = await Promise.all([
        supabase.from('operators').select('*').eq('is_active', true).order('name'),
        supabase.from('issues').select('assigned_to, status'),
      ])

      const issues = issuesRes.data ?? []
      const statsMap: Record<string, { resolved: number; open: number }> = {}
      for (const issue of issues) {
        if (!issue.assigned_to) continue
        if (!statsMap[issue.assigned_to]) statsMap[issue.assigned_to] = { resolved: 0, open: 0 }
        if (issue.status === 'resolved') statsMap[issue.assigned_to].resolved++
        else statsMap[issue.assigned_to].open++
      }

      const ops = (opsRes.data ?? []).map(op => ({
        ...op,
        resolved_count: statsMap[op.id]?.resolved ?? 0,
        open_count: statsMap[op.id]?.open ?? 0,
      }))
      setOperators(ops)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtered = operators.filter(op =>
    !search || op.name.toLowerCase().includes(search.toLowerCase()) ||
    op.id.includes(search)
  )

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader icon={Users} title="Operators" subtitle={`${operators.length} active operators`} />

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--app-text-muted)' }} />
          <Input
            placeholder="Search by name or badge ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--app-card)' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((op, idx) => (
              <div
                key={op.id}
                className="rounded-xl p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-fill-mode:backwards]"
                style={{
                  backgroundColor: 'var(--app-card)',
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
                  animationDelay: `${idx * 40}ms`,
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--app-text)' }}>{op.name}</p>
                    <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--app-text-muted)' }}>#{op.id}</p>
                  </div>
                  <Badge
                    variant={op.role === 'admin' ? 'success' : 'outline'}
                    className="text-xs capitalize"
                  >
                    {op.role === 'admin' ? 'Supervisor' : op.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-mono font-semibold text-green-600">{op.resolved_count}</span>
                    <span className="text-xs" style={{ color: 'var(--app-text-muted)' }}>resolved</span>
                  </div>
                  {op.open_count > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="font-mono font-semibold text-red-500">{op.open_count}</span>
                      <span className="text-xs" style={{ color: 'var(--app-text-muted)' }}>open</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
