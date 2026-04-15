'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Cpu,
  AlertCircle,
  Package,
  BarChart2,
  Users,
  ClipboardList,
  FileText,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

const adminNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/machines', icon: Cpu, label: 'Machines' },
  { href: '/issues', icon: AlertCircle, label: 'Issues' },
  { href: '/spares', icon: Package, label: 'Spare Parts' },
  { href: '/reports', icon: BarChart2, label: 'Reports' },
  { href: '/operators', icon: Users, label: 'Operators' },
  { href: '/audit', icon: ClipboardList, label: 'Audit Log' },
]

const operatorNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/my-issues', icon: FileText, label: 'My Issues' },
  { href: '/machines', icon: Cpu, label: 'Machines' },
]

export function Sidebar() {
  const { isAdmin } = useAuth()
  const pathname = usePathname()
  const nav = isAdmin ? adminNav : operatorNav

  return (
    <aside className="w-56 flex-shrink-0 h-full bg-white border-r border-gray-200 flex flex-col">
      <nav className="flex-1 py-4 px-2 space-y-1">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-[#0d7a3e] text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
