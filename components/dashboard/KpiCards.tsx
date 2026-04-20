'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Cpu, AlertTriangle, Wrench, AlertCircle, Activity, Clock } from 'lucide-react'
import { formatDuration } from '@/lib/format'
import { LivePulseDot } from '@/components/ui/LivePulseDot'

interface KpiData {
  running: number
  down: number
  maintenance: number
  minorIssue: number
  openIssues: number
  downtime7d: number
}

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    cancelAnimationFrame(raf.current)
    if (value === 0) { setDisplay(0); return }
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(eased * value))
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration])

  return <>{display}</>
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

    const channel = supabase
      .channel('kpi-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, fetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, fetch)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const totalMachines = data.running + data.down + data.maintenance + data.minorIssue

  const cards = [
    {
      label: 'Running',
      value: data.running,
      icon: Cpu,
      color: '#22c55e',
      borderColor: '#22c55e',
      subtitle: totalMachines > 0 ? `${Math.round((data.running / totalMachines) * 100)}% of fleet` : '',
    },
    {
      label: 'Down',
      value: data.down,
      icon: AlertTriangle,
      color: '#ef4444',
      borderColor: '#ef4444',
      pulse: data.down > 0,
      urgent: data.down > 0,
      subtitle: data.down > 0 ? 'Needs attention' : 'All clear',
    },
    {
      label: 'Maintenance',
      value: data.maintenance,
      icon: Wrench,
      color: '#f59e0b',
      borderColor: '#f59e0b',
      subtitle: 'Scheduled service',
    },
    {
      label: 'Minor Issues',
      value: data.minorIssue,
      icon: AlertCircle,
      color: '#3b82f6',
      borderColor: '#3b82f6',
      subtitle: 'Non-critical',
    },
    {
      label: 'Open Issues',
      value: data.openIssues,
      icon: Activity,
      color: '#8b5cf6',
      borderColor: '#8b5cf6',
      subtitle: 'Awaiting resolution',
    },
    {
      label: 'Downtime (7d)',
      value: formatDuration(data.downtime7d),
      icon: Clock,
      color: '#ef4444',
      borderColor: '#ef4444',
      isText: true,
      subtitle: 'Total breakdown time',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[130px] rounded-xl animate-pulse"
            style={{ backgroundColor: 'var(--app-card)' }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map(({ label, value, icon: Icon, color, borderColor, pulse, isText, subtitle, urgent }: any, idx: number) => (
        <div
          key={label}
          className="rounded-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:backwards]"
          style={{
            backgroundColor: 'var(--app-card)',
            borderLeft: `3px solid ${borderColor}`,
            boxShadow: urgent
              ? `0 0 0 1px ${color}25, 0 4px 16px ${color}15`
              : '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
            animationDelay: `${idx * 80}ms`,
          }}
        >
          {/* Subtle gradient overlay */}
          <div
            className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity"
            style={{ background: `linear-gradient(135deg, ${color}, transparent 60%)` }}
          />

          <div className="relative p-4 flex flex-col justify-between min-h-[130px]">
            {/* Header: label + icon */}
            <div className="flex items-start justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--app-text-muted)' }}>
                {label}
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${pulse ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: color + '12' }}
              >
                <Icon className="w-4.5 h-4.5" style={{ color }} />
              </div>
            </div>

            {/* Value */}
            <div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`font-bold leading-none tracking-tight ${isText ? 'text-xl' : 'text-3xl'}`}
                  style={{ color }}
                >
                  {isText ? value : <AnimatedNumber value={value} duration={1200 + idx * 100} />}
                </span>
                <LivePulseDot />
              </div>
              {subtitle && (
                <p className="text-[11px] mt-2 font-medium" style={{ color: 'var(--app-text-muted)' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
