'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const [badgeId, setBadgeId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) router.replace('/dashboard')
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: loginError } = await login(badgeId)
    if (loginError) {
      setError(loginError)
      setLoading(false)
    } else {
      router.replace('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0a2540' }}>
      {/* Main content — two columns on desktop */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="flex items-center gap-16 max-w-5xl w-full">

          {/* Left — factory illustration (hidden on mobile) */}
          <div className="hidden md:flex flex-1 items-center justify-center">
            <svg viewBox="0 0 400 380" className="w-full max-w-[400px]" fill="none" xmlns="http://www.w3.org/2000/svg">
              <style>{`
                @keyframes draw {
                  from { stroke-dashoffset: 1000; }
                  to { stroke-dashoffset: 0; }
                }
                @keyframes bubble-rise {
                  0% { opacity: 0.6; }
                  100% { opacity: 0; }
                }
                .machine-line {
                  stroke: #3b82f6;
                  stroke-opacity: 0.25;
                  stroke-width: 0.5;
                  fill: none;
                  stroke-dasharray: 1000;
                  stroke-dashoffset: 1000;
                  animation: draw 0.8s ease-out forwards;
                }
                .ml-1 { animation-delay: 0ms; }
                .ml-2 { animation-delay: 80ms; }
                .ml-3 { animation-delay: 160ms; }
                .ml-4 { animation-delay: 240ms; }
                .ml-5 { animation-delay: 320ms; }
                .ml-6 { animation-delay: 400ms; }
                .ml-7 { animation-delay: 480ms; }
                .ml-8 { animation-delay: 560ms; }
                .ml-9 { animation-delay: 640ms; }
                .ml-10 { animation-delay: 720ms; }
              `}</style>

              {/* Extruder */}
              <rect className="machine-line ml-1" x="40" y="260" width="120" height="100" rx="2" />
              <rect className="machine-line ml-2" x="95" y="240" width="10" height="20" />
              <circle className="machine-line ml-3" cx="100" cy="200" r="36" />
              <line className="machine-line ml-4" x1="100" y1="164" x2="100" y2="100" />
              <ellipse className="machine-line ml-5" cx="100" cy="90" rx="20" ry="10" />
              <ellipse className="machine-line ml-6" cx="100" cy="70" rx="15" ry="8" />
              <ellipse className="machine-line ml-7" cx="100" cy="54" rx="12" ry="6" />

              {/* Flexo printer */}
              <rect className="machine-line ml-5" x="220" y="270" width="110" height="90" rx="2" />
              <rect className="machine-line ml-6" x="250" y="230" width="50" height="40" rx="2" />
              <circle className="machine-line ml-7" cx="275" cy="190" r="24" />

              {/* Ground line */}
              <line className="machine-line ml-8" x1="20" y1="360" x2="380" y2="360" />

              {/* Rising bubbles — extruder */}
              <circle cx="92" cy="40" r="3" fill="#3b82f6" fillOpacity="0.15">
                <animate attributeName="cy" values="60;20" dur="4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0" dur="4s" repeatCount="indefinite" />
              </circle>
              <circle cx="108" cy="45" r="2" fill="#3b82f6" fillOpacity="0.15">
                <animate attributeName="cy" values="55;15" dur="4s" begin="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0" dur="4s" begin="1.5s" repeatCount="indefinite" />
              </circle>

              {/* Rising bubbles — flexo */}
              <circle cx="275" cy="150" r="3" fill="#3b82f6" fillOpacity="0.15">
                <animate attributeName="cy" values="170;130" dur="3.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0" dur="3.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="268" cy="155" r="2" fill="#3b82f6" fillOpacity="0.15">
                <animate attributeName="cy" values="165;125" dur="3.5s" begin="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0" dur="3.5s" begin="1s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          {/* Right — login card */}
          <div className="w-full max-w-[400px] mx-auto md:mx-0">
            <div className="rounded-xl p-10" style={{ backgroundColor: '#12315a' }}>
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <Image
                  src="/logo.png"
                  alt="Al Arabi Plastic Factory"
                  width={180}
                  height={56}
                  className="object-contain h-14"
                />
              </div>

              {/* Title */}
              <div className="text-center mb-6">
                <h1 className="text-[22px] font-medium" style={{ color: '#f1f5f9' }}>
                  AlArabi Plastic Factory
                </h1>
                <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
                  Maintenance Tracker
                </p>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>
                  نظام متابعة الصيانة
                </p>
              </div>

              {/* Divider */}
              <div className="h-px mb-5" style={{ backgroundColor: '#1e293b' }} />

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="badge" className="text-[13px] block" style={{ color: '#94a3b8' }}>
                    Badge ID
                  </label>
                  <input
                    id="badge"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Enter badge ID"
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    autoFocus
                    className="w-full h-12 rounded-md px-4 text-center text-lg font-mono tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: '#0a1929',
                      border: '0.5px solid #1e293b',
                    }}
                    onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px #3b82f6'}
                    onBlur={e => e.currentTarget.style.boxShadow = 'none'}
                  />
                </div>

                {error && (
                  <div className="rounded-md px-4 py-3 text-sm" style={{ backgroundColor: '#dc262620', border: '1px solid #dc262640', color: '#fca5a5' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !badgeId.trim()}
                  className="w-full h-11 rounded-md text-base font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#1d4ed8' }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.backgroundColor = '#1e40af' }}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#1d4ed8'}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    'Sign In →'
                  )}
                </button>
              </form>

              {/* Footer text */}
              <p className="text-[11px] text-center mt-5" style={{ color: '#64748b' }}>
                Factory floor access only · Contact supervisor for badge issues
              </p>
            </div>

            {/* Below card */}
            <p className="text-center text-xs mt-5" style={{ color: '#ffffff40' }}>
              AlKhudairi Group · Est. 1983
            </p>
          </div>
        </div>
      </div>

      {/* Page footer */}
      <div className="px-6 py-4 text-center" style={{ borderTop: '1px solid #1e293b' }}>
        <p className="text-xs" style={{ color: '#ffffff30' }}>
          Al Arabi Plastic Factory · Sabhan Industrial, Kuwait · ISO 9001 · ISO 14001 · ISO 45001
        </p>
      </div>
    </div>
  )
}
