'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Cpu, AlertTriangle, Wrench, AlertCircle, Activity, Clock } from 'lucide-react'
import { formatDuration } from '@/lib/format'

interface KpiData {
  running: number
  down: number
  maintenance: number
  minorIssue: number
  openIssues: number
  downtime7d: number
}

export function KpiCards() {
  const [data, setData] = useState<KpiData>({
    running: 0, down: 0, maintenance: 0, minorIssue: 0, openIssues: 0, downtime7d: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const [machines, issues, downtime] = await Promise.all([
        supabase.from('machines').select('status'),
        supabase.from('issues').select('id').eq('status', 'open'),
        supabase.from('issues')
          .select('duration_minutes')
          .eq('type', 'breakdown')
          .eq('status', 'resolved')
          .gte('end_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ])

      const ms = machines.data ?? []
      const totalDowntime = (downtime.data ?? []).reduce(
        (sum, r) => sum + (r.duration_minutes ?? 0), 0
      )

      setData({
        running: ms.filter(m => m.status === 'Running').length,
        down: ms.filter(m => m.status === 'Down').length,
        maintenance: ms.filter(m => m.status === 'Maintenance').length,
        minorIssue: ms.filter(m => m.status === 'Minor Issue').length,
        openIssues: issues.data?.length ?? 0,
        downtime7d: totalDowntime,
      })
      setLoading(false)
    }
    fetch()

    // Realtime subscription for live updates
    const channel = supabase
      .channel('kpi-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, fetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, fetch)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const cards = [
    {
      label: 'Running',
      value: data.running,
      icon: Cpu,
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#86efac',
    },
    {
      label: 'Down',
      value: data.down,
      icon: AlertTriangle,
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fca5a5',
      pulse: true,
    },
    {
      label: 'Maintenance',
      value: data.maintenance,
      icon: Wrench,
      color: '#b45309',
      bg: '#fffbeb',
      border: '#fcd34d',
    },
    {
      label: 'Minor Issues',
      value: data.minorIssue,
      icon: AlertCircle,
      color: '#1d4ed8',
      bg: '#eff6ff',
      border: '#93c5fd',
    },
    {
      label: 'Open Issues',
      value: data.openIssues,
      icon: Activity,
      color: '#7c3aed',
      bg: '#f5f3ff',
      border: '#c4b5fd',
    },
    {
      label: 'Downtime 7d',
      value: formatDuration(data.downtime7d),
      icon: Clock,
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fca5a5',
      isText: true,
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--app-card)' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map(({ label, value, icon: Icon, color, bg, border, pulse, isText }) => (
        <div
          key={label}
          className="rounded-lg border p-4 flex flex-col gap-2"
          style={{ backgroundColor: bg, borderColor: border }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: '#4b5563' }}>{label}</span>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${pulse ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: color + '20' }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
          </div>
          <div
            className={`font-bold ${isText ? 'text-lg' : 'text-3xl'}`}
            style={{ color }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  )
}
