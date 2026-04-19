'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Cpu, AlertCircle, Package,
  BarChart2, Users, ClipboardList, FileText,
  Wrench, Settings, X,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: Props) {
  const { user, isAdmin, isTechnician } = useAuth()
  const { t } = useLanguage()
  const pathname = usePathname()
  const [assignedCount, setAssignedCount] = useState(0)
  const [unassignedCount, setUnassignedCount] = useState(0)

  // Live badge for technicians — open + in_progress issues assigned to them
  useEffect(() => {
    if (!isTechnician || !user?.id) return

    async function fetchCount() {
      const { count } = await supabase
        .from('issues')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', user!.id)
        .in('status', ['open', 'in_progress'])
      setAssignedCount(count ?? 0)
    }

    fetchCount()

    const channel = supabase
      .channel(`assigned-issues-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'issues',
        filter: `assigned_to=eq.${user.id}`,
      }, () => fetchCount())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isTechnician, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Live badge for admin — open issues that are unassigned (need attention)
  useEffect(() => {
    if (!isAdmin) return

    async function fetchUnassigned() {
      const { count } = await supabase
        .from('issues')
        .select('id', { count: 'exact', head: true })
        .is('assigned_to', null)
        .eq('status', 'open')
      setUnassignedCount(count ?? 0)
    }

    fetchUnassigned()

    const channel = supabase
      .channel('unassigned-issues-admin')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'issues',
      }, () => fetchUnassigned())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isAdmin]) // eslint-disable-line react-hooks/exhaustive-deps

  const adminNav = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard'),  badge: 0 },
    { href: '/machines',  icon: Cpu,             label: t('machines'),   badge: 0 },
    { href: '/issues',    icon: AlertCircle,      label: t('issues'),     badge: unassignedCount },
    { href: '/spares',    icon: Package,          label: t('spareParts'), badge: 0 },
    { href: '/reports',   icon: BarChart2,        label: t('reports'),    badge: 0 },
    { href: '/operators', icon: Users,            label: t('operators'),  badge: 0 },
    { href: '/audit',     icon: ClipboardList,    label: t('auditLog'),   badge: 0 },
    { href: '/settings',  icon: Settings,         label: t('settings'),   badge: 0 },
  ]

  const technicianNav = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard'),    badge: 0 },
    { href: '/my-issues', icon: Wrench,          label: t('myWorkOrders'), badge: assignedCount },
    { href: '/machines',  icon: Cpu,             label: t('machines'),     badge: 0 },
    { href: '/settings',  icon: Settings,        label: t('settings'),     badge: 0 },
  ]

  const operatorNav = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/my-issues', icon: FileText,        label: t('myIssues') },
    { href: '/machines',  icon: Cpu,             label: t('machines') },
    { href: '/settings',  icon: Settings,        label: t('settings') },
  ]

  const nav = isAdmin ? adminNav : isTechnician ? technicianNav : operatorNav

  const navContent = (
    <nav className="flex-1 py-4 px-2 space-y-1">
      {nav.map(({ href, icon: Icon, label, badge }: any) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
              active ? 'bg-[#0d7a3e] text-white' : 'hover:text-gray-900'
            )}
            style={active ? {} : { color: 'var(--app-text-muted)' }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--app-nav-hover)' }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = '' }}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center leading-none">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-56 flex-shrink-0 h-full flex-col border-r"
        style={{ backgroundColor: 'var(--app-sidebar-bg)', borderColor: 'var(--app-sidebar-border)' }}
      >
        {navContent}
      </aside>

      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 flex flex-col border-r transition-transform duration-200 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ backgroundColor: 'var(--app-sidebar-bg)', borderColor: 'var(--app-sidebar-border)' }}
      >
        <div
          className="flex items-center justify-between px-4 h-16 flex-shrink-0"
          style={{ backgroundColor: '#0d3320', borderBottom: '3px solid #16a34a' }}
        >
          <span className="text-white font-semibold text-sm">{t('maintenanceTracker')}</span>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        {navContent}
      </aside>
    </>
  )
}
