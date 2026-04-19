'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Mode = 'light' | 'dark'
export type Accent = 'navy' | 'blue' | 'green' | 'purple' | 'rose' | 'orange'

export const ACCENTS: { value: Accent; label: string; color: string }[] = [
  { value: 'navy',   label: 'Navy',   color: '#1d4ed8' },
  { value: 'blue',   label: 'Blue',   color: '#3b82f6' },
  { value: 'green',  label: 'Green',  color: '#10b981' },
  { value: 'purple', label: 'Purple', color: '#8b5cf6' },
  { value: 'rose',   label: 'Rose',   color: '#f43f5e' },
  { value: 'orange', label: 'Orange', color: '#f97316' },
]

interface ThemeContextType {
  mode: Mode
  accent: Accent
  setMode: (m: Mode) => void
  setAccent: (a: Accent) => void
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  accent: 'navy',
  setMode: () => {},
  setAccent: () => {},
})

const MODE_KEY = 'alarabi_theme_mode'
const ACCENT_KEY = 'alarabi_theme_accent'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>('light')
  const [accent, setAccentState] = useState<Accent>('navy')

  useEffect(() => {
    // Read from localStorage (inline script already applied class/attr to avoid FOUC)
    const storedMode = localStorage.getItem(MODE_KEY) as Mode | null
    const storedAccent = localStorage.getItem(ACCENT_KEY) as Accent | null
    if (storedMode === 'dark' || storedMode === 'light') setModeState(storedMode)
    if (storedAccent && ACCENTS.some(a => a.value === storedAccent)) setAccentState(storedAccent)
  }, [])

  const setMode = (m: Mode) => {
    setModeState(m)
    localStorage.setItem(MODE_KEY, m)
    document.documentElement.classList.toggle('dark', m === 'dark')
  }

  const setAccent = (a: Accent) => {
    setAccentState(a)
    localStorage.setItem(ACCENT_KEY, a)
    document.documentElement.setAttribute('data-accent', a)
  }

  // Backward compat: migrate old 'alarabi_theme' key
  useEffect(() => {
    const old = localStorage.getItem('alarabi_theme')
    if (old === 'dark' || old === 'light') {
      localStorage.setItem(MODE_KEY, old)
      localStorage.removeItem('alarabi_theme')
      setModeState(old)
      document.documentElement.classList.toggle('dark', old === 'dark')
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
