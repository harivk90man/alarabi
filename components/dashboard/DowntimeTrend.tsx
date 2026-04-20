'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-context'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingDown, Timer } from 'lucide-react'
import { formatDuration } from '@/lib/format'

interface DayData {
  day: string
  label: string
  downtime: number
  issues: number
}

export function DowntimeTrend() {
  const { mode } = useTheme()
  const [data, setData] = useState<DayData[]>([])
  const [mttr, setMttr] = useState(0)
  const [totalIssues, setTotalIssues] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const now = new Date()
      const days: DayData[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now)
        d.setDate(d.getDate() - (6 - i))
        return {
          day: d.toISOString().split('T')[0],
          label: d.toLocaleDateString('en-US', { weekday: 'short' }),
          downtime: 0,
          issues: 0,
        }
      })

      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const [allIssues, resolved] = await Promise.all([
        supabase
          .from('issues')
          .select('start_time, duration_minutes, type')
          .gte('start_time', sevenDaysAgo.toISOString()),
        supabase
          .from('issues')
          .select('duration_minutes')
          .eq('type', 'breakdown')
          .eq('status', 'resolved')
          .gte('end_time', sevenDaysAgo.toISOString()),
      ])

      let issueCount = 0
      for (const issue of allIssues.data ?? []) {
        const issueDay = issue.start_time?.split('T')[0]
        const dayEntry = days.find(d => d.day === issueDay)
        if (dayEntry) {
          dayEntry.issues++
          issueCount++
          if (issue.type === 'breakdown') {
            dayEntry.downtime += issue.duration_minutes ?? 0
          }
        }
      }

      const resolvedData = resolved.data ?? []
      const totalRepair = resolvedData.reduce((s, r) => s + (r.duration_minutes ?? 0), 0)
      setMttr(resolvedData.length > 0 ? Math.round(totalRepair / resolvedData.length) : 0)
      setTotalIssues(issueCount)
      setData(days)
      setLoading(false)
    }
    load()
  }, [])

  const isDark = mode === 'dark'

  if (loading) {
    return (
      <div
        className="rounded-xl p-6 animate-pulse"
        style={{ backgroundColor: 'var(--app-card)', minHeight: '340px' }}
      />
    )
  }

  const maxDowntime = Math.max(...data.map(d => d.downtime), 60)

  return (
    <div
      className="rounded-xl p-6"
      style={{
        backgroundColor: 'var(--app-card)',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--app-text)' }}>
            Downtime Trend
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-muted)' }}>
            7-day breakdown downtime (minutes)
          </p>
        </div>

        {/* MTTR badge */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}
          >
            <Timer className="w-3.5 h-3.5" style={{ color: 'var(--app-text-muted)' }} />
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--app-text-muted)' }}>
                MTTR
              </p>
              <p className="text-sm font-bold leading-none" style={{ color: 'var(--app-text)' }}>
                {mttr > 0 ? formatDuration(mttr) : '--'}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}
          >
            <TrendingDown className="w-3.5 h-3.5" style={{ color: 'var(--app-text-muted)' }} />
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--app-text-muted)' }}>
                Issues
              </p>
              <p className="text-sm font-bold leading-none" style={{ color: 'var(--app-text)' }}>
                {totalIssues}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="downtimeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#1e293b' : '#f1f5f9'}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }}
              domain={[0, maxDowntime]}
              tickFormatter={(v: number) => `${v}m`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.[0]) return null
                return (
                  <div
                    className="rounded-lg px-3 py-2"
                    style={{
                      backgroundColor: isDark ? '#1e293b' : '#fff',
                      border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  >
                    <p className="text-xs font-semibold" style={{ color: isDark ? '#f1f5f9' : '#111827' }}>
                      {label}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                      Downtime: <strong>{payload[0].value}m</strong>
                    </p>
                    {payload[0]?.payload?.issues > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>
                        Issues: {payload[0].payload.issues}
                      </p>
                    )}
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="downtime"
              stroke="#ef4444"
              strokeWidth={2.5}
              fill="url(#downtimeGradient)"
              dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: isDark ? '#1e293b' : '#fff' }}
              activeDot={{ r: 6, fill: '#ef4444', strokeWidth: 2, stroke: isDark ? '#1e293b' : '#fff' }}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
