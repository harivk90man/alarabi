'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface CategoryStat {
  name: string
  total: number
  running: number
  down: number
  pct: number
}

export function CategoryHealth() {
  const [stats, setStats] = useState<CategoryStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('machines')
        .select('status, categories(name)')

      if (!data) return

      const map: Record<string, { total: number; running: number; down: number }> = {}
      for (const m of data) {
        const catRaw = m.categories as unknown
        const cat = (Array.isArray(catRaw) ? catRaw[0]?.name : (catRaw as { name: string } | null)?.name) ?? 'Unknown'
        if (!map[cat]) map[cat] = { total: 0, running: 0, down: 0 }
        map[cat].total++
        if (m.status === 'Running') map[cat].running++
        if (m.status === 'Down') map[cat].down++
      }

      const result = Object.entries(map)
        .map(([name, v]) => ({
          name,
          total: v.total,
          running: v.running,
          down: v.down,
          pct: v.total > 0 ? Math.round((v.running / v.total) * 100) : 100,
        }))
        .sort((a, b) => a.pct - b.pct)

      setStats(result)
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) {
    return <div className="h-48 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--app-nav-hover)' }} />
  }

  return (
    <div className="rounded-lg border p-5"
      style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)' }}>
      <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--app-text)' }}>Category Health</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {stats.map(({ name, down, pct }) => {
          const barColor = pct === 100 ? '#16a34a' : pct >= 80 ? '#b45309' : '#dc2626'
          return (
            <div key={name} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium truncate" style={{ color: 'var(--app-text)' }}>{name}</span>
                <span className="text-xs font-mono ml-2" style={{ color: 'var(--app-text-muted)' }}>{pct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--app-nav-hover)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
              <div className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
                {pct}% operational
                {down > 0 && (
                  <span className="text-red-500 ml-1">· {down} down</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
