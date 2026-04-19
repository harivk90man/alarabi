'use client'

import { useTheme, ACCENTS } from '@/lib/theme-context'
import { useLanguage } from '@/lib/language-context'
import { Sun, Moon, Globe, Check, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SettingsView() {
  const { mode, accent, setMode, setAccent } = useTheme()
  const { lang, setLang, t } = useLanguage()

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--app-text)' }}>{t('settings')}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>{t('settingsDesc')}</p>
      </div>

      {/* Appearance */}
      <div className="rounded-lg border p-5 space-y-5" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)' }}>
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" style={{ color: 'var(--app-text-muted)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--app-text)' }}>{t('themeAppearance')}</h2>
        </div>

        {/* Mode */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--app-text-muted)' }}>{t('themeMode')}</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('light')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all"
              style={{
                borderColor: mode === 'light' ? 'var(--brand-accent)' : 'var(--app-card-border)',
                backgroundColor: mode === 'light' ? 'var(--brand-accent)' : 'var(--app-card)',
                color: mode === 'light' ? '#fff' : 'var(--app-text-muted)',
              }}
            >
              <Sun className="w-6 h-6" />
              <span className="text-sm font-medium">{t('light')}</span>
            </button>
            <button
              onClick={() => setMode('dark')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all"
              style={{
                borderColor: mode === 'dark' ? 'var(--brand-accent)' : 'var(--app-card-border)',
                backgroundColor: mode === 'dark' ? 'var(--brand-accent)' : 'var(--app-card)',
                color: mode === 'dark' ? '#fff' : 'var(--app-text-muted)',
              }}
            >
              <Moon className="w-6 h-6" />
              <span className="text-sm font-medium">{t('dark')}</span>
            </button>
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--app-text-muted)' }}>{t('themeAccent')}</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {ACCENTS.map(a => (
              <button
                key={a.value}
                onClick={() => setAccent(a.value)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all"
                style={{
                  borderColor: accent === a.value ? a.color : 'var(--app-card-border)',
                  backgroundColor: 'var(--app-card)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: a.color }}
                >
                  {accent === a.value && <Check className="w-5 h-5 text-white" />}
                </div>
                <span className="text-xs font-medium" style={{ color: accent === a.value ? a.color : 'var(--app-text-muted)' }}>
                  {t(`themeAccent${a.value.charAt(0).toUpperCase() + a.value.slice(1)}`)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--app-text-muted)' }}>{t('themePreview')}</p>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--app-card-border)' }}>
            <div className="h-10 flex items-center px-4 gap-2" style={{ backgroundColor: 'var(--brand-primary)' }}>
              <div className="w-16 h-4 rounded bg-white/20" />
              <div className="flex-1" />
              <div className="w-8 h-4 rounded bg-white/20" />
            </div>
            <div className="p-4 flex gap-3" style={{ backgroundColor: 'var(--app-bg)' }}>
              <Button size="sm" className="text-xs">Primary Button</Button>
              <Button size="sm" variant="outline" className="text-xs">Outline</Button>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: 'var(--success)' }}>
                Running
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="rounded-lg border p-5 space-y-3" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4" style={{ color: 'var(--app-text-muted)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--app-text)' }}>{t('language')} / اللغة</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLang('en')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all"
            style={{
              borderColor: lang === 'en' ? 'var(--brand-accent)' : 'var(--app-card-border)',
              backgroundColor: lang === 'en' ? 'var(--brand-accent)' : 'var(--app-card)',
              color: lang === 'en' ? '#fff' : 'var(--app-text-muted)',
            }}
          >
            <span className="text-2xl">🇬🇧</span>
            <span className="text-sm font-medium">English</span>
          </button>
          <button
            onClick={() => setLang('ar')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all"
            style={{
              borderColor: lang === 'ar' ? 'var(--brand-accent)' : 'var(--app-card-border)',
              backgroundColor: lang === 'ar' ? 'var(--brand-accent)' : 'var(--app-card)',
              color: lang === 'ar' ? '#fff' : 'var(--app-text-muted)',
            }}
          >
            <span className="text-2xl">🇰🇼</span>
            <span className="text-sm font-medium">العربية</span>
          </button>
        </div>
        {lang === 'ar' && (
          <p className="text-xs px-3 py-2 rounded border" style={{ color: '#b45309', backgroundColor: '#fffbeb', borderColor: '#fcd34d' }}>
            الترجمة متاحة للقائمة الجانبية والعناوين الرئيسية
          </p>
        )}
      </div>
    </div>
  )
}
