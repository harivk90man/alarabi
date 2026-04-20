'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface CategoryStat {
  name: string
  total: number
  running: number
  down: number
  maintenance: number
  pct: number
}

function MiniRing({ pct, color, size = 28 }: { pct: number; color: string; size?: number }) {
  const r = (size - 4) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90 flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--app-nav-hover)" strokeWidth="3" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  )
}

export function CategoryHealth() {
  const [stats, setStats] = useState<CategoryStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('machines')
        .select('status, categories(name)')

      if (!data) return

      const map: Record<string, { total: number; running: number; down: number; maintenance: number }> = {}
      for (const m of data) {
        const catRaw = m.categories as unknown
        const cat = (Array.isArray(catRaw) ? catRaw[0]?.name : (catRaw as { name: string } | null)?.name) ?? 'Unknown'
        if (!map[cat]) map[cat] = { total: 0, running: 0, down: 0, maintenance: 0 }
        map[cat].total++
        if (m.status === 'Running') map[cat].running++
        if (m.status === 'Down') map[cat].down++
        if (m.status === 'Maintenance') map[cat].maintenance++
      }

      const result = Object.entries(map)
        .map(([name, v]) => ({
          name,
          total: v.total,
          running: v.running,
          down: v.down,
          maintenance: v.maintenance,
          pct: v.total > 0 ? Math.round((v.running / v.total) * 100) : 100,
        }))
        .sort((a, b) => a.pct - b.pct)

      setStats(result)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div
        className="rounded-xl p-6 animate-pulse"
        style={{
          backgroundColor: 'var(--app-card)',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
          minHeight: '280px',
        }}
      />
    )
  }

  return (
    <div
      className="rounded-xl p-6"
      style={{
        backgroundColor: 'var(--app-card)',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--app-text)' }}>
            Category Health
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-muted)' }}>
            Machine status by production line
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--app-text-muted)' }}>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22c55e]" /> Running</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> Maint.</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444]" /> Down</span>
        </div>
      </div>

      <div className="space-y-4">
        {stats.map(({ name, total, running, down, maintenance, pct }, idx) => {
          const statusColor = pct === 100 ? '#22c55e' : pct >= 80 ? '#f59e0b' : '#ef4444'
          const runPct = total > 0 ? (running / total) * 100 : 0
          const maintPct = total > 0 ? (maintenance / total) * 100 : 0
          const downPct = total > 0 ? (down / total) * 100 : 0

          return (
            <div
              key={name}
              className="animate-in fade-in slide-in-from-left-2 duration-500 [animation-fill-mode:backwards]"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <MiniRing pct={pct} color={statusColor} />
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--app-text)' }}>{name}</span>
                    <span className="text-[11px] font-mono ml-1.5" style={{ color: 'var(--app-text-muted)' }}>
                      ({total})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {down > 0 && (
                    <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-500">
                      {down} down
                    </span>
                  )}
                  <span className="text-sm font-bold font-mono w-10 text-right tabular-nums" style={{ color: statusColor }}>
                    {pct}%
                  </span>
                </div>
              </div>

              {/* Stacked bar */}
              <div className="h-2 rounded-full overflow-hidden flex" style={{ backgroundColor: 'var(--app-nav-hover)' }}>
                {runPct > 0 && (
                  <div
                    className="h-full transition-all duration-1000 ease-out"
                    style={{ width: `${runPct}%`, backgroundColor: '#22c55e' }}
                  />
                )}
                {maintPct > 0 && (
                  <div
                    className="h-full transition-all duration-1000 ease-out"
                    style={{ width: `${maintPct}%`, backgroundColor: '#f59e0b' }}
                  />
                )}
                {downPct > 0 && (
                  <div
                    className="h-full transition-all duration-1000 ease-out"
                    style={{ width: `${downPct}%`, backgroundColor: '#ef4444' }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
