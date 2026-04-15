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
    return <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Category Health</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {stats.map(({ name, total, down, pct }) => {
          const barColor = pct === 100 ? '#16a34a' : pct >= 80 ? '#b45309' : '#dc2626'
          return (
            <div key={name} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-700 truncate">{name}</span>
                <span className="text-xs font-mono text-gray-500 ml-2">{pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
              <div className="text-xs text-gray-400">
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
