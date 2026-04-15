'use client'

import Image from 'next/image'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function Header() {
  const { user, logout } = useAuth()
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

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{ backgroundColor: '#0d3320', borderBottom: '3px solid #16a34a' }}
    >
      <div className="flex h-16 items-center px-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Image
            src="https://img1.wsimg.com/isteam/ip/c1812088-d5b4-4d7c-b39c-afa691bded3c/White%404x.png"
            alt="Al Arabi Plastic Factory"
            width={120}
            height={36}
            className="object-contain"
            unoptimized
          />
          <div className="w-px h-8 bg-white/20" />
          <div>
            <div className="text-white font-semibold text-sm leading-tight">Maintenance Tracker</div>
            <div className="text-white/60 text-xs font-mono">
              {counts.machines} machines · {counts.operators} operators
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* User info */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <User className="w-4 h-4 text-white/60" />
              <span className="text-white text-sm font-medium">{user.name}</span>
              <Badge
                variant={user.role === 'admin' ? 'success' : 'info'}
                className="text-xs uppercase tracking-wide"
              >
                {user.role === 'admin' ? 'Supervisor' : 'Operator'}
              </Badge>
              <span className="text-white/40 font-mono text-xs">#{user.id}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
