'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-context'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface FleetData {
  running: number
  down: number
  maintenance: number
  minor: number
  total: number
}

const SEGMENTS = [
  { key: 'running',     label: 'Running',     color: '#22c55e' },
  { key: 'maintenance', label: 'Maintenance', color: '#f59e0b' },
  { key: 'minor',       label: 'Minor Issue', color: '#3b82f6' },
  { key: 'down',        label: 'Down',        color: '#ef4444' },
] as const

export function FleetStatus() {
  const { mode } = useTheme()
  const [data, setData] = useState<FleetData>({ running: 0, down: 0, maintenance: 0, minor: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: machines } = await supabase.from('machines').select('status')
      if (!machines) return
      setData({
        running: machines.filter(m => m.status === 'Running').length,
        down: machines.filter(m => m.status === 'Down').length,
        maintenance: machines.filter(m => m.status === 'Maintenance').length,
        minor: machines.filter(m => m.status === 'Minor Issue').length,
        total: machines.length,
      })
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel('fleet-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, load)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) {
    return (
      <div
        className="rounded-xl p-6 animate-pulse"
        style={{ backgroundColor: 'var(--app-card)', minHeight: '340px' }}
      />
    )
  }

  const isDark = mode === 'dark'
  const chartData = SEGMENTS
    .map(seg => ({ name: seg.label, value: data[seg.key], color: seg.color }))
    .filter(d => d.value > 0)

  return (
    <div
      className="rounded-xl p-6"
      style={{
        backgroundColor: 'var(--app-card)',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
      }}
    >
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--app-text)' }}>
          Fleet Distribution
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-muted)' }}>
          Current machine status overview
        </p>
      </div>

      {/* Donut Chart */}
      <div className="relative" style={{ height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              animationBegin={200}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null
                const d = payload[0]
                return (
                  <div
                    className="rounded-lg px-3 py-2 text-xs font-medium"
                    style={{
                      backgroundColor: isDark ? '#1e293b' : '#fff',
                      border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                      color: isDark ? '#f1f5f9' : '#111827',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  >
                    <span style={{ color: d.payload.color }}>{d.name}</span>
                    <span className="ml-2 font-bold">{d.value}</span>
                    <span className="ml-1 opacity-50">
                      ({data.total > 0 ? Math.round(((d.value as number) / data.total) * 100) : 0}%)
                    </span>
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="text-3xl font-black tabular-nums" style={{ color: 'var(--app-text)' }}>
              {data.total}
            </span>
            <span className="block text-[10px] uppercase tracking-wider font-semibold mt-0.5" style={{ color: 'var(--app-text-muted)' }}>
              machines
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {chartData.map(seg => (
          <div
            key={seg.name}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: seg.color + '08' }}
          >
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] block" style={{ color: 'var(--app-text-muted)' }}>
                {seg.name}
              </span>
            </div>
            <span className="text-sm font-bold tabular-nums" style={{ color: seg.color }}>
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
