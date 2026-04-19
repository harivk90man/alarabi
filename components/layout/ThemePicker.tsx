'use client'

import { Palette, Sun, Moon, Check } from 'lucide-react'
import { useTheme, ACCENTS, type Accent } from '@/lib/theme-context'
import { useLanguage } from '@/lib/language-context'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import Link from 'next/link'

export function ThemePicker() {
  const { mode, accent, setMode, setAccent } = useTheme()
  const { t } = useLanguage()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="text-white/70 hover:text-white p-1.5 rounded transition-colors hover:bg-white/10 flex-shrink-0"
          aria-label="Theme"
        >
          <Palette className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="space-y-3">
          {/* Mode */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--app-text-muted)' }}>{t('themeMode')}</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('light')}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all"
                style={{
                  borderColor: mode === 'light' ? 'var(--brand-accent)' : 'var(--app-card-border)',
                  backgroundColor: mode === 'light' ? 'var(--brand-accent)' : 'var(--app-card)',
                  color: mode === 'light' ? '#fff' : 'var(--app-text)',
                }}
              >
                <Sun className="w-3.5 h-3.5" />{t('light')}
              </button>
              <button
                onClick={() => setMode('dark')}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all"
                style={{
                  borderColor: mode === 'dark' ? 'var(--brand-accent)' : 'var(--app-card-border)',
                  backgroundColor: mode === 'dark' ? 'var(--brand-accent)' : 'var(--app-card)',
                  color: mode === 'dark' ? '#fff' : 'var(--app-text)',
                }}
              >
                <Moon className="w-3.5 h-3.5" />{t('dark')}
              </button>
            </div>
          </div>

          {/* Accent */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--app-text-muted)' }}>{t('themeAccent')}</p>
            <div className="flex gap-2 flex-wrap">
              {ACCENTS.map(a => (
                <button
                  key={a.value}
                  onClick={() => setAccent(a.value)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: a.color,
                    boxShadow: accent === a.value ? `0 0 0 2px var(--app-card), 0 0 0 4px ${a.color}` : undefined,
                  }}
                  title={a.label}
                  aria-label={`${a.label} accent`}
                >
                  {accent === a.value && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Link to settings */}
          <div className="pt-1 border-t" style={{ borderColor: 'var(--app-card-border)' }}>
            <Link href="/settings" className="text-xs hover:underline" style={{ color: 'var(--brand-accent)' }}>
              {t('themeSeeAll')} →
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
