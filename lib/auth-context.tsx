'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'
import type { Operator } from '@/types/database'

interface AuthContextType {
  user: Operator | null
  loading: boolean
  login: (badgeId: string) => Promise<{ error: string | null }>
  logout: () => void
  isAdmin: boolean
  isTechnician: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const SESSION_KEY = 'alarabi_user_session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Operator | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from localStorage
    try {
      const stored = localStorage.getItem(SESSION_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Operator
        setUser(parsed)
      }
    } catch {
      localStorage.removeItem(SESSION_KEY)
    }
    setLoading(false)
  }, [])

  const login = async (badgeId: string): Promise<{ error: string | null }> => {
    const trimmed = badgeId.trim()
    if (!trimmed) return { error: 'Please enter your badge ID' }

    const { data, error } = await supabase
      .from('operators')
      .select('*')
      .eq('id', trimmed)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return { error: 'Badge ID not found. Please check and try again.' }
    }

    setUser(data)
    localStorage.setItem(SESSION_KEY, JSON.stringify(data))

    // Log audit
    await supabase.from('audit_log').insert({
      operator_id: data.id,
      action: 'OPERATOR_LOGIN',
      entity_type: 'operator',
      entity_id: data.id,
      details: { name: data.name },
    })

    return { error: null }
  }

  const logout = () => {
    if (user) {
      supabase.from('audit_log').insert({
        operator_id: user.id,
        action: 'OPERATOR_LOGOUT',
        entity_type: 'operator',
        entity_id: user.id,
        details: { name: user.name },
      }).then(() => {})
    }
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        isTechnician: user?.role === 'technician',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
