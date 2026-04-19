import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/lib/theme-context'
import { LanguageProvider } from '@/lib/language-context'

export const metadata: Metadata = {
  title: 'APF Maintenance Tracker',
  description: 'Al Arabi Plastic Factory — Maintenance Tracking System',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'APF Maint',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a2540',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="APF Maint" />
        {/* Anti-FOUC: apply theme mode + accent before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                var mode = localStorage.getItem('alarabi_theme_mode') || localStorage.getItem('alarabi_theme') || 'light';
                var accent = localStorage.getItem('alarabi_theme_accent') || 'navy';
                if (mode === 'dark') document.documentElement.classList.add('dark');
                document.documentElement.setAttribute('data-accent', accent);
              } catch(e) {}
            })();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function() {});
              });
            }
          `
        }} />
      </body>
    </html>
  )
}
