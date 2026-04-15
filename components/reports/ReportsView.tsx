'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { formatDuration } from '@/lib/format'

type Period = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

function getPeriodStart(period: Period): Date {
  const now = new Date()
  switch (period) {
    case 'daily': return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'weekly': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return d
    }
    case 'monthly': return new Date(now.getFullYear(), now.getMonth(), 1)
    case 'quarterly': return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    case 'yearly': return new Date(now.getFullYear(), 0, 1)
  }
}

interface DowntimeMachine {
  machine_id: string
  total_minutes: number
}

interface OperatorStat {
  name: string
  resolved: number
  avg_minutes: number
}

interface Summary {
  total: number
  breakdowns: number
  minor: number
  preventive: number
}

export function ReportsView() {
  const [period, setPeriod] = useState<Period>('monthly')
  const [summary, setSummary] = useState<Summary>({ total: 0, breakdowns: 0, minor: 0, preventive: 0 })
  const [downtimeData, setDowntimeData] = useState<DowntimeMachine[]>([])
  const [operatorStats, setOperatorStats] = useState<OperatorStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReports() {
      setLoading(true)
      const startDate = getPeriodStart(period).toISOString()

      const { data: issues } = await supabase
        .from('issues')
        .select('id, type, status, machine_id, duration_minutes, assigned_to, operators!issues_assigned_to_fkey(name)')
        .gte('start_time', startDate)

      if (!issues) { setLoading(false); return }

      // Summary
      setSummary({
        total: issues.length,
        breakdowns: issues.filter(i => i.type === 'breakdown').length,
        minor: issues.filter(i => i.type === 'minor').length,
        preventive: issues.filter(i => i.type === 'preventive').length,
      })

      // Downtime by machine (breakdowns only)
      const downtimeMap: Record<string, number> = {}
      for (const issue of issues.filter(i => i.type === 'breakdown' && i.status === 'resolved')) {
        downtimeMap[issue.machine_id] = (downtimeMap[issue.machine_id] ?? 0) + (issue.duration_minutes ?? 0)
      }
      const dtData = Object.entries(downtimeMap)
        .map(([machine_id, total_minutes]) => ({ machine_id, total_minutes }))
        .sort((a, b) => b.total_minutes - a.total_minutes)
        .slice(0, 10)
      setDowntimeData(dtData)

      // Operator performance
      const opMap: Record<string, { name: string; resolved: number; totalMinutes: number }> = {}
      for (const issue of issues.filter(i => i.status === 'resolved' && i.assigned_to)) {
        const opRaw = issue.operators as unknown
        const name = (Array.isArray(opRaw) ? opRaw[0]?.name : (opRaw as { name: string } | null)?.name) ?? issue.assigned_to ?? 'Unknown'
        const id = issue.assigned_to!
        if (!opMap[id]) opMap[id] = { name, resolved: 0, totalMinutes: 0 }
        opMap[id].resolved++
        opMap[id].totalMinutes += issue.duration_minutes ?? 0
      }
      const opStats = Object.values(opMap)
        .map(v => ({ name: v.name, resolved: v.resolved, avg_minutes: v.resolved > 0 ? Math.round(v.totalMinutes / v.resolved) : 0 }))
        .sort((a, b) => b.resolved - a.resolved)
        .slice(0, 10)
      setOperatorStats(opStats)

      setLoading(false)
    }
    fetchReports()
  }, [period])

  const PERIODS: Period[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']

  const total = summary.total || 1
  const breakdown_pct = Math.round((summary.breakdowns / total) * 100)
  const minor_pct = Math.round((summary.minor / total) * 100)
  const preventive_pct = Math.round((summary.preventive / total) * 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Analytics and performance insights</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {PERIODS.map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              period === p
                ? 'bg-[#0d7a3e] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-[#0d7a3e] hover:text-[#0d7a3e]'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Issues', value: summary.total, color: '#1a1a18' },
          { label: 'Breakdowns', value: summary.breakdowns, color: '#dc2626' },
          { label: 'Minor Issues', value: summary.minor, color: '#b45309' },
          { label: 'Preventive', value: summary.preventive, color: '#1d4ed8' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Issue distribution bar */}
      {summary.total > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Issue Type Distribution</h2>
          <div className="flex h-8 rounded-lg overflow-hidden gap-0.5">
            {breakdown_pct > 0 && (
              <div
                className="flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${breakdown_pct}%`, backgroundColor: '#dc2626' }}
              >
                {breakdown_pct}%
              </div>
            )}
            {minor_pct > 0 && (
              <div
                className="flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${minor_pct}%`, backgroundColor: '#b45309' }}
              >
                {minor_pct}%
              </div>
            )}
            {preventive_pct > 0 && (
              <div
                className="flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${preventive_pct}%`, backgroundColor: '#1d4ed8' }}
              >
                {preventive_pct}%
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#dc2626]" />Breakdown ({summary.breakdowns})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#b45309]" />Minor ({summary.minor})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#1d4ed8]" />Preventive ({summary.preventive})</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Downtime Machines */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Top Downtime Machines</h2>
          {loading ? (
            <div className="h-48 bg-gray-50 rounded animate-pulse" />
          ) : downtimeData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No breakdown data for this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={downtimeData} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={v => formatDuration(v)} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="machine_id" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} width={48} />
                <Tooltip formatter={(v: number) => [formatDuration(v), 'Downtime']} />
                <Bar dataKey="total_minutes" radius={[0, 4, 4, 0]}>
                  {downtimeData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#dc2626' : i === 1 ? '#b45309' : '#0d7a3e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Operator Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Operator Performance</h2>
          {operatorStats.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No resolved issues for this period</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left pb-2">Name</th>
                  <th className="text-right pb-2">Resolved</th>
                  <th className="text-right pb-2">Avg Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {operatorStats.map(op => (
                  <tr key={op.name}>
                    <td className="py-2 font-medium text-gray-800">{op.name}</td>
                    <td className="py-2 text-right">
                      <span className="inline-block bg-green-100 text-green-700 font-mono text-xs px-2 py-0.5 rounded-full">
                        {op.resolved}
                      </span>
                    </td>
                    <td className="py-2 text-right text-gray-500 font-mono text-xs">
                      {op.avg_minutes > 0 ? formatDuration(op.avg_minutes) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
