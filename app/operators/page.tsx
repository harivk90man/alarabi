'use client'

export const dynamic = 'force-dynamic'

import { AppShell } from '@/components/layout/AppShell'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
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
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operators</h1>
          <p className="text-gray-500 text-sm mt-1">{operators.length} active operators</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
              <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(op => (
              <div
                key={op.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{op.name}</p>
                    <p className="font-mono text-xs text-gray-400 mt-0.5">#{op.id}</p>
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
                    <span className="font-mono font-semibold text-green-700">{op.resolved_count}</span>
                    <span className="text-xs text-gray-400">resolved</span>
                  </div>
                  {op.open_count > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="font-mono font-semibold text-red-600">{op.open_count}</span>
                      <span className="text-xs text-gray-400">open</span>
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
