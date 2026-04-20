'use client'

import { type LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  children?: React.ReactNode
}

export function PageHeader({ icon: Icon, title, subtitle, children }: PageHeaderProps) {
  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-accent) 100%)',
        boxShadow: '0 4px 20px -4px rgba(0,0,0,0.15)',
      }}
    >
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* Decorative circle */}
      <div
        className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, white, transparent 70%)' }}
      />

      <div className="relative px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-white/50 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
