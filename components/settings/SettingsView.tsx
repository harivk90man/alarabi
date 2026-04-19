'use client'

import { useTheme } from '@/lib/theme-context'
import { useLanguage } from '@/lib/language-context'
import { Sun, Moon, Globe } from 'lucide-react'

export function SettingsView() {
  const { theme, setTheme } = useTheme()
  const { lang, setLang, t } = useLanguage()

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--app-text)' }}>{t('settings')}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>{t('settingsDesc')}</p>
      </div>

      {/* Theme */}
      <div className="rounded-lg border p-5 space-y-3" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)' }}>
        <div className="flex items-center gap-2 mb-1">
          {theme === 'dark' ? <Moon className="w-4 h-4" style={{ color: 'var(--app-text-muted)' }} /> : <Sun className="w-4 h-4" style={{ color: 'var(--app-text-muted)' }} />}
          <h2 className="text-sm font-semibold" style={{ color: 'var(--app-text)' }}>{t('theme')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTheme('light')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all"
            style={{
              borderColor: theme === 'light' ? '#1d4ed8' : 'var(--app-card-border)',
              backgroundColor: theme === 'light' ? '#eff6ff' : 'var(--app-card)',
              color: theme === 'light' ? '#1d4ed8' : 'var(--app-text-muted)',
            }}
          >
            <Sun className="w-6 h-6" />
            <span className="text-sm font-medium">{t('light')}</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all"
            style={{
              borderColor: theme === 'dark' ? '#1d4ed8' : 'var(--app-card-border)',
              backgroundColor: theme === 'dark' ? '#eff6ff' : 'var(--app-card)',
              color: theme === 'dark' ? '#1d4ed8' : 'var(--app-text-muted)',
            }}
          >
            <Moon className="w-6 h-6" />
            <span className="text-sm font-medium">{t('dark')}</span>
          </button>
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
              borderColor: lang === 'en' ? '#1d4ed8' : 'var(--app-card-border)',
              backgroundColor: lang === 'en' ? '#eff6ff' : 'var(--app-card)',
              color: lang === 'en' ? '#1d4ed8' : 'var(--app-text-muted)',
            }}
          >
            <span className="text-2xl">🇬🇧</span>
            <span className="text-sm font-medium">English</span>
          </button>
          <button
            onClick={() => setLang('ar')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all"
            style={{
              borderColor: lang === 'ar' ? '#1d4ed8' : 'var(--app-card-border)',
              backgroundColor: lang === 'ar' ? '#eff6ff' : 'var(--app-card)',
              color: lang === 'ar' ? '#1d4ed8' : 'var(--app-text-muted)',
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
