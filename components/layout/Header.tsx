'use client'

import Image from 'next/image'
import { LogOut, User, Menu, Globe } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ThemePicker } from './ThemePicker'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: Props) {
  const { user, logout } = useAuth()
  const { lang, setLang, t } = useLanguage()
  const [counts, setCounts] = useState({ machines: 0, operators: 0 })

  useEffect(() => {
    async function fetchCounts() {
      const [m, o] = await Promise.all([
        supabase.from('machines').select('id', { count: 'exact', head: true }),
        supabase.from('operators').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ])
      setCounts({ machines: m.count ?? 0, operators: o.count ?? 0 })
    }
    fetchCounts()
  }, [])

  const roleLabel = user?.role === 'admin'
    ? t('supervisor')
    : user?.role === 'technician'
    ? t('technician')
    : t('operator')

  const toggleLang = () => setLang(lang === 'en' ? 'ar' : 'en')

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{ backgroundColor: 'var(--brand-primary)', borderBottom: '3px solid var(--brand-accent)' }}
    >
      <div className="flex h-16 items-center px-4 gap-3">
        {/* Hamburger — mobile only */}
        <button
          className="md:hidden text-white/70 hover:text-white p-1 rounded flex-shrink-0"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
          <Image
            src="/logo.png"
            alt="Al Arabi Plastic Factory"
            width={100}
            height={30}
            className="object-contain flex-shrink-0"
          />
          <div className="hidden sm:block w-px h-8 bg-white/20" />
          <div className="hidden sm:block min-w-0">
            <div className="text-white font-semibold text-sm leading-tight">{t('maintenanceTracker')}</div>
            <div className="text-white/60 text-xs font-mono">
              {counts.machines} machines · {counts.operators} active
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* User info + language + theme + logout */}
        {user && (
          <div className="flex items-center gap-1.5">
            <div className="hidden sm:flex items-center gap-2 mr-1">
              <User className="w-4 h-4 text-white/60 flex-shrink-0" />
              <span className="text-white text-sm font-medium truncate max-w-[120px]">{user.name}</span>
              <Badge
                variant={user.role === 'admin' ? 'success' : user.role === 'technician' ? 'info' : 'outline'}
                className="text-xs uppercase tracking-wide flex-shrink-0"
              >
                {roleLabel}
              </Badge>
              <span className="text-white/40 font-mono text-xs flex-shrink-0">#{user.id}</span>
            </div>

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="text-white/70 hover:text-white p-1.5 rounded transition-colors hover:bg-white/10 flex-shrink-0 flex items-center gap-1"
              aria-label="Toggle language"
              title={lang === 'en' ? 'العربية' : 'English'}
            >
              <Globe className="w-4 h-4" />
              <span className="text-[10px] font-semibold uppercase">{lang === 'en' ? 'AR' : 'EN'}</span>
            </button>

            {/* Theme picker */}
            <ThemePicker />

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-white/70 hover:text-white hover:bg-white/10 flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">{t('logout')}</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
