'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { formatDuration } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Download, Loader2, CalendarRange } from 'lucide-react'
import { exportCSV, exportPDF } from '@/lib/report-export'
import { getSparePartsUsageReport } from '@/lib/queries'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportIssue {
  id: string
  issue_number: string
  machine_id: string
  type: string
  maintenance_category_code: string | null
  status: string
  description: string
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  downtime: boolean
  reported_by: string | null
  assigned_to: string | null
  resolution: string | null
  reporter_name: string | null
  assignee_name: string | null
}

export interface ReportData {
  summary: { total: number; breakdowns: number; minor: number; preventive: number }
  totalDowntimeMin: number
  issues: ReportIssue[]
  downtimeMachines: { machine_id: string; total_minutes: number }[]
  operatorStats: { name: string; resolved: number; avg_minutes: number }[]
  categoryMap: Record<string, string>  // code → description
}

// ─── Period helpers ───────────────────────────────────────────────────────────

type Period = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

function periodRange(period: Period): { from: Date; to: Date } {
  const now = new Date()
  const to = new Date(now)
  let from: Date

  switch (period) {
    case 'today':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      from = new Date(now); from.setDate(from.getDate() - 7)
      break
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'quarter':
      from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      break
    case 'year':
      from = new Date(now.getFullYear(), 0, 1)
      break
    default:
      from = new Date(now.getFullYear(), now.getMonth(), 1)
  }
  return { from, to }
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReportsView() {
  const [period, setPeriod] = useState<Period>('month')
  const [customFrom, setCustomFrom] = useState(toInputDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
  const [customTo, setCustomTo] = useState(toInputDate(new Date()))
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null)
  const [partsUsage, setPartsUsage] = useState<{
    byCategory: { category: string; stock_category: string | null; total_used: number; total_cost: number }[]
    topConsumed: { part_number: string; name: string; category: string | null; total_used: number; unit_cost: number }[]
  } | null>(null)

  // Stable ISO strings — only recompute when period/custom inputs change
  const { fromISO, toISO } = useMemo(() => {
    if (period === 'custom') {
      return {
        fromISO: new Date(customFrom).toISOString(),
        toISO: new Date(customTo + 'T23:59:59').toISOString(),
      }
    }
    const { from, to } = periodRange(period)
    // Snap "to" to end-of-day so it doesn't drift on every render
    to.setHours(23, 59, 59, 999)
    return { fromISO: from.toISOString(), toISO: to.toISOString() }
  }, [period, customFrom, customTo])

  const from = new Date(fromISO)
  const to = new Date(toISO)

  useEffect(() => {
    let cancelled = false

    async function fetchReports() {
      setLoading(true)

      const [issueRes, catRes] = await Promise.all([
        supabase
          .from('issues')
          .select(`
            id, issue_number, machine_id, type, maintenance_category_code,
            status, description, start_time, end_time, duration_minutes, downtime,
            reported_by, assigned_to, resolution,
            reporter:operators!issues_reported_by_fkey(name),
            assignee:operators!issues_assigned_to_fkey(name)
          `)
          .gte('start_time', fromISO)
          .lte('start_time', toISO)
          .order('start_time', { ascending: false }),
        supabase.from('maintenance_categories').select('code, description'),
      ])

      const issues = issueRes.data
      if (!issues || cancelled) { setLoading(false); return }

      // Build code → description map
      const categoryMap: Record<string, string> = {}
      for (const c of (catRes.data ?? [])) {
        categoryMap[(c as any).code] = (c as any).description
      }

      // Flatten operator names
      const flatIssues: ReportIssue[] = issues.map((i: any) => ({
        ...i,
        reporter_name: Array.isArray(i.reporter) ? i.reporter[0]?.name : i.reporter?.name ?? null,
        assignee_name: Array.isArray(i.assignee) ? i.assignee[0]?.name : i.assignee?.name ?? null,
        resolution: i.resolution ?? null,
      }))

      // Summary
      const summary = {
        total: flatIssues.length,
        breakdowns: flatIssues.filter(i => i.type === 'breakdown').length,
        minor: flatIssues.filter(i => i.type === 'minor').length,
        preventive: flatIssues.filter(i => i.type === 'preventive').length,
      }

      // Downtime by machine
      const dtMap: Record<string, number> = {}
      for (const i of flatIssues.filter(i => i.type === 'breakdown' && i.status === 'resolved')) {
        dtMap[i.machine_id] = (dtMap[i.machine_id] ?? 0) + (i.duration_minutes ?? 0)
      }
      const downtimeMachines = Object.entries(dtMap)
        .map(([machine_id, total_minutes]) => ({ machine_id, total_minutes }))
        .sort((a, b) => b.total_minutes - a.total_minutes)
        .slice(0, 10)

      const totalDowntimeMin = Object.values(dtMap).reduce((s, v) => s + v, 0)

      // Operator stats
      const opMap: Record<string, { name: string; resolved: number; totalMin: number }> = {}
      for (const i of flatIssues.filter(i => i.status === 'resolved' && i.assigned_to)) {
        const id = i.assigned_to!
        const name = i.assignee_name ?? id
        if (!opMap[id]) opMap[id] = { name, resolved: 0, totalMin: 0 }
        opMap[id].resolved++
        opMap[id].totalMin += i.duration_minutes ?? 0
      }
      const operatorStats = Object.values(opMap)
        .map(v => ({ name: v.name, resolved: v.resolved, avg_minutes: v.resolved > 0 ? Math.round(v.totalMin / v.resolved) : 0 }))
        .sort((a, b) => b.resolved - a.resolved)
        .slice(0, 10)

      if (!cancelled) {
        setData({ summary, totalDowntimeMin, issues: flatIssues, downtimeMachines, operatorStats, categoryMap })
        setLoading(false)
      }
    }

    fetchReports()
    return () => { cancelled = true }
  }, [fromISO, toISO])

  // Fetch spare parts usage report
  useEffect(() => {
    getSparePartsUsageReport(fromISO, toISO).then(setPartsUsage)
  }, [fromISO, toISO])

  const handleExportCSV = () => {
    if (!data) return
    exportCSV(data, from, to)
  }

  const handleExportPDF = async () => {
    if (!data) return
    setExporting('pdf')
    try {
      await exportPDF(data, from, to)
    } finally {
      setExporting(null)
    }
  }

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Last 7 Days' },
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'This Quarter' },
    { key: 'year', label: 'This Year' },
    { key: 'custom', label: 'Custom Range' },
  ]

  const total = data?.summary.total || 1
  const breakdown_pct = Math.round(((data?.summary.breakdowns ?? 0) / total) * 100)
  const minor_pct = Math.round(((data?.summary.minor ?? 0) / total) * 100)
  const preventive_pct = Math.round(((data?.summary.preventive ?? 0) / total) * 100)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--app-text)' }}>Reports</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>
            Analytics and performance insights
            {!loading && data && (
              <span className="ml-2 text-[#1d4ed8] font-medium">
                · {data.summary.total} issues in period
              </span>
            )}
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={loading || !data || data.summary.total === 0}
            className="gap-2 border-gray-300"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={handleExportPDF}
            disabled={loading || !data || data.summary.total === 0 || exporting === 'pdf'}
            className="gap-2"
          >
            {exporting === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            {exporting === 'pdf' ? 'Generating…' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Period selector + custom date range */}
      <div className="rounded-lg border p-4 space-y-3" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)' }}>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                period === key
                  ? 'bg-[#1d4ed8] text-white border-[#1d4ed8]'
                  : 'border-transparent hover:border-[#1d4ed8] hover:text-[#1d4ed8]'
              }`}
              style={period !== key ? { backgroundColor: 'var(--app-card)', color: 'var(--app-text-muted)', borderColor: 'var(--app-card-border)' } : undefined}
            >
              {key === 'custom' && <CalendarRange className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
              {label}
            </button>
          ))}
        </div>

        {/* Custom date range inputs */}
        {period === 'custom' && (
          <div className="flex flex-wrap gap-4 items-end pt-1 border-t" style={{ borderColor: 'var(--app-card-border)' }}>
            <div className="space-y-1">
              <Label className="text-xs" style={{ color: 'var(--app-text-muted)' }}>From</Label>
              <Input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                max={customTo}
                className="w-40 h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs" style={{ color: 'var(--app-text-muted)' }}>To</Label>
              <Input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                min={customFrom}
                max={toInputDate(new Date())}
                className="w-40 h-8 text-sm"
              />
            </div>
            <div className="text-xs pb-1.5" style={{ color: 'var(--app-text-muted)' }}>
              {(() => {
                const days = Math.round((new Date(customTo).getTime() - new Date(customFrom).getTime()) / 86400000)
                return `${days + 1} day${days !== 0 ? 's' : ''} selected`
              })()}
            </div>
          </div>
        )}

        {/* Active range label */}
        <div className="text-xs flex items-center gap-1" style={{ color: 'var(--app-text-muted)' }}>
          <CalendarRange className="w-3 h-3" />
          Showing: <span className="font-medium" style={{ color: 'var(--app-text)' }}>
            {from.toLocaleDateString('en-KW', { day: '2-digit', month: 'short', year: 'numeric' })}
            {' '}&rarr;{' '}
            {to.toLocaleDateString('en-KW', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--app-nav-hover)' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Total Issues', value: data?.summary.total ?? 0, color: '#1a1a18' },
            { label: 'Breakdowns', value: data?.summary.breakdowns ?? 0, color: '#dc2626' },
            { label: 'Minor Issues', value: data?.summary.minor ?? 0, color: '#b45309' },
            { label: 'Preventive', value: data?.summary.preventive ?? 0, color: '#1d4ed8' },
            { label: 'Total Downtime', value: formatDuration(data?.totalDowntimeMin ?? 0), color: '#dc2626', isText: true },
          ].map(({ label, value, color, isText }) => (
            <div key={label} className="rounded-lg border p-4" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--app-text-muted)' }}>{label}</p>
              <p className={`font-bold mt-1 ${isText ? 'text-xl' : 'text-3xl'}`} style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Distribution bar */}
      {!loading && data && data.summary.total > 0 && (
        <div className="rounded-lg border p-5" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)' }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--app-text)' }}>Issue Type Distribution</h2>
          <div className="flex h-7 rounded-lg overflow-hidden gap-0.5">
            {breakdown_pct > 0 && (
              <div className="flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${breakdown_pct}%`, backgroundColor: '#dc2626' }}>
                {breakdown_pct}%
              </div>
            )}
            {minor_pct > 0 && (
              <div className="flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${minor_pct}%`, backgroundColor: '#b45309' }}>
                {minor_pct}%
              </div>
            )}
            {preventive_pct > 0 && (
              <div className="flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${preventive_pct}%`, backgroundColor: '#1d4ed8' }}>
                {preventive_pct}%
              </div>
            )}
          </div>
          <div className="flex gap-5 mt-2 text-xs" style={{ color: 'var(--app-text-muted)' }}>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#dc2626]" />Breakdown ({data.summary.breakdowns})</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#b45309]" />Minor ({data.summary.minor})</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#1d4ed8]" />Preventive ({data.summary.preventive})</span>
          </div>
        </div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Downtime chart */}
          <div className="rounded-lg border p-5" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--app-text)' }}>Top Downtime Machines</h2>
            {data.downtimeMachines.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--app-text-muted)' }}>No breakdown data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.downtimeMachines} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => formatDuration(v)} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="machine_id" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} width={44} />
                  <Tooltip formatter={(v: number) => [formatDuration(v), 'Downtime']} />
                  <Bar dataKey="total_minutes" radius={[0, 4, 4, 0]}>
                    {data.downtimeMachines.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#dc2626' : i === 1 ? '#b45309' : '#1d4ed8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Operator performance */}
          <div className="rounded-lg border p-5" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--app-text)' }}>Operator Performance</h2>
            {data.operatorStats.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--app-text-muted)' }}>No resolved issues for this period</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'var(--app-card-border)', color: 'var(--app-text-muted)' }}>
                    <th className="text-left pb-2">Name</th>
                    <th className="text-right pb-2">Resolved</th>
                    <th className="text-right pb-2">Avg Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--app-card-border)' }}>
                  {data.operatorStats.map(op => (
                    <tr key={op.name}>
                      <td className="py-2 font-medium" style={{ color: 'var(--app-text)' }}>{op.name}</td>
                      <td className="py-2 text-right">
                        <span className="inline-block bg-green-100 text-green-700 font-mono text-xs px-2 py-0.5 rounded-full">
                          {op.resolved}
                        </span>
                      </td>
                      <td className="py-2 text-right font-mono text-xs" style={{ color: 'var(--app-text-muted)' }}>
                        {op.avg_minutes > 0 ? formatDuration(op.avg_minutes) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Spare Parts Usage */}
      {!loading && partsUsage && (partsUsage.byCategory.length > 0 || partsUsage.topConsumed.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By category */}
          <div className="rounded-lg border p-5" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--app-text)' }}>Parts Usage by Category (KWD)</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'var(--app-card-border)', color: 'var(--app-text-muted)' }}>
                  <th className="text-left pb-2">Category</th>
                  <th className="text-left pb-2">Sub-Category</th>
                  <th className="text-right pb-2">Used</th>
                  <th className="text-right pb-2">Value (KWD)</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--app-card-border)' }}>
                {partsUsage.byCategory.slice(0, 15).map((row, i) => (
                  <tr key={i}>
                    <td className="py-2" style={{ color: 'var(--app-text)' }}>{row.category}</td>
                    <td className="py-2 text-xs" style={{ color: 'var(--app-text-muted)' }}>{row.stock_category ?? '—'}</td>
                    <td className="py-2 text-right font-mono">{row.total_used}</td>
                    <td className="py-2 text-right font-mono font-medium">{row.total_cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              {partsUsage.byCategory.length > 0 && (
                <tfoot>
                  <tr className="border-t" style={{ borderColor: 'var(--app-card-border)' }}>
                    <td colSpan={3} className="py-2 font-semibold" style={{ color: 'var(--app-text)' }}>Total</td>
                    <td className="py-2 text-right font-mono font-bold">
                      {partsUsage.byCategory.reduce((s, r) => s + r.total_cost, 0).toFixed(2)} KWD
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Top consumed */}
          <div className="rounded-lg border p-5" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--app-text)' }}>Top 10 Most-Consumed Parts</h2>
            {partsUsage.topConsumed.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--app-text-muted)' }}>No parts consumed in this period</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: 'var(--app-card-border)', color: 'var(--app-text-muted)' }}>
                    <th className="text-left pb-2">Part</th>
                    <th className="text-left pb-2">Name</th>
                    <th className="text-right pb-2">Used</th>
                    <th className="text-right pb-2">Cost/Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--app-card-border)' }}>
                  {partsUsage.topConsumed.map(p => (
                    <tr key={p.part_number}>
                      <td className="py-2 font-mono text-xs" style={{ color: 'var(--app-text-muted)' }}>{p.part_number}</td>
                      <td className="py-2 max-w-[160px] truncate" style={{ color: 'var(--app-text)' }}>{p.name}</td>
                      <td className="py-2 text-right font-mono font-bold">{p.total_used}</td>
                      <td className="py-2 text-right font-mono" style={{ color: 'var(--app-text-muted)' }}>{p.unit_cost > 0 ? `${p.unit_cost.toFixed(2)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Issues detail table */}
      {!loading && data && data.issues.length > 0 && (
        <div className="rounded-lg border p-5 overflow-x-auto" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--app-text)' }}>Issues Detail</h2>
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="border-b uppercase tracking-wide" style={{ borderColor: 'var(--app-card-border)', color: 'var(--app-text-muted)' }}>
                <th className="text-left pb-2 pr-3 whitespace-nowrap">Issue #</th>
                <th className="text-left pb-2 pr-3 whitespace-nowrap">Machine</th>
                <th className="text-left pb-2 pr-3 whitespace-nowrap">Type</th>
                <th className="text-left pb-2 pr-3 whitespace-nowrap">Category</th>
                <th className="text-left pb-2 pr-3 whitespace-nowrap">Status</th>
                <th className="text-left pb-2 pr-3 whitespace-nowrap">Assigned To</th>
                <th className="text-left pb-2 pr-3 whitespace-nowrap">Duration</th>
                <th className="text-left pb-2">Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--app-card-border)' }}>
              {data.issues.map(issue => (
                <tr key={issue.id} className="hover:bg-gray-50/50">
                  <td className="py-2 pr-3 font-mono font-bold" style={{ color: 'var(--app-text)' }}>{issue.issue_number}</td>
                  <td className="py-2 pr-3 font-mono text-[#1d4ed8]">{issue.machine_id}</td>
                  <td className="py-2 pr-3 capitalize">{issue.type}</td>
                  <td className="py-2 pr-3 max-w-[160px]" style={{ color: 'var(--app-text-muted)' }}>
                    {issue.maintenance_category_code
                      ? <span title={issue.maintenance_category_code}>
                          {data.categoryMap[issue.maintenance_category_code] ?? issue.maintenance_category_code}
                        </span>
                      : '—'}
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{issue.status.replace('_', ' ')}</span>
                  </td>
                  <td className="py-2 pr-3" style={{ color: 'var(--app-text-muted)' }}>{issue.assignee_name ?? '—'}</td>
                  <td className="py-2 pr-3 font-mono" style={{ color: 'var(--app-text-muted)' }}>{issue.duration_minutes ? formatDuration(issue.duration_minutes) : '—'}</td>
                  <td className="py-2 max-w-[200px] truncate" style={{ color: 'var(--app-text-muted)' }}>{issue.resolution || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No data state */}
      {!loading && data && data.summary.total === 0 && (
        <div className="rounded-lg border py-16 text-center" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)', color: 'var(--app-text-muted)' }}>
          <FileText className="w-10 h-10 mx-auto mb-3" />
          <p className="font-medium">No issues in this period</p>
          <p className="text-sm mt-1">Try a wider date range</p>
        </div>
      )}
    </div>
  )
}
