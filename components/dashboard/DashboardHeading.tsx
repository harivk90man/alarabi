'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import { supabase } from '@/lib/supabase'
import { Activity, Zap, TrendingUp, Shield, Clock } from 'lucide-react'
import { LivePulseDot } from '@/components/ui/LivePulseDot'

interface FleetSummary {
  total: number
  running: number
  down: number
  maintenance: number
}

function useAnimatedValue(target: number, duration = 1500) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    cancelAnimationFrame(raf.current)
    if (target === 0) { setValue(0); return }
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(eased * target))
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return value
}

export function DashboardHeading() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [fleet, setFleet] = useState<FleetSummary>({ total: 0, running: 0, down: 0, maintenance: 0 })

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('machines').select('status')
      if (!data) return
      setFleet({
        total: data.length,
        running: data.filter(m => m.status === 'Running').length,
        down: data.filter(m => m.status === 'Down').length,
        maintenance: data.filter(m => m.status === 'Maintenance').length,
      })
    }
    load()
  }, [])

  const healthPct = fleet.total > 0 ? Math.round((fleet.running / fleet.total) * 100) : 0
  const animatedPct = useAnimatedValue(healthPct)
  const firstName = user?.name?.split(' ')[0] ?? 'Operator'

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const shift = hour >= 6 && hour < 14 ? 'Morning Shift' : hour >= 14 && hour < 22 ? 'Evening Shift' : 'Night Shift'

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const radius = 52
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (animatedPct / 100) * circumference
  const ringColor = healthPct >= 90 ? '#22c55e' : healthPct >= 70 ? '#f59e0b' : '#ef4444'

  const quickStats = [
    { label: 'Total Fleet', value: fleet.total, icon: Zap },
    { label: 'Operational', value: fleet.running, icon: TrendingUp },
    { label: 'Need Attention', value: fleet.down + fleet.maintenance, icon: Shield },
  ]

  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-accent) 100%)',
        boxShadow: '0 8px 32px -8px var(--brand-accent)',
      }}
    >
      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* Large decorative circle */}
      <div
        className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, white, transparent 70%)' }}
      />

      <div className="relative p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        {/* Left: Greeting + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
              {t('dashboardTitle')}
            </span>
            <LivePulseDot />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            {greeting}, {firstName}
          </h1>

          <div className="flex items-center gap-3 mt-2 text-sm text-white/50 flex-wrap">
            <span>{dateStr}</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {shift}
            </span>
          </div>

          {/* Quick stats chips */}
          <div className="flex items-center gap-3 mt-6 flex-wrap">
            {quickStats.map(stat => (
              <div
                key={stat.label}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-white/80" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white leading-none">{stat.value}</p>
                  <p className="text-[10px] text-white/45 mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Health Ring */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="relative w-36 h-36 md:w-40 md:h-40">
            {/* Outer glow */}
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-30 transition-colors duration-1000"
              style={{ backgroundColor: ringColor }}
            />
            <svg className="w-full h-full -rotate-90 relative" viewBox="0 0 120 120">
              {/* Track */}
              <circle
                cx="60" cy="60" r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              {/* Progress */}
              <circle
                cx="60" cy="60" r={radius}
                fill="none"
                stroke={ringColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-[2s] ease-out"
                style={{ filter: `drop-shadow(0 0 6px ${ringColor}90)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl md:text-[2.75rem] font-black text-white leading-none tabular-nums">
                {animatedPct}%
              </span>
              <span className="text-[10px] text-white/40 mt-1 uppercase tracking-[0.15em] font-semibold">
                fleet health
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
