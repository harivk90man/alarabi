'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogIn, Factory } from 'lucide-react'

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
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0a2540 0%, #12315a 50%, #1d4ed8 100%)' }}
    >
      {/* Header bar */}
      <div style={{ borderBottom: '3px solid #1d4ed8' }} className="px-6 py-4">
        <Image
          src="/logo.png"
          alt="Al Arabi Plastic Factory"
          width={140}
          height={40}
          className="object-contain"
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Card header */}
            <div
              className="px-8 py-6 text-center"
              style={{ backgroundColor: '#0a2540' }}
            >
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center">
                  <Factory className="w-7 h-7 text-white" />
                </div>
              </div>
              <h1 className="text-white text-xl font-bold">AlArabi Plastic Factory</h1>
              <p className="text-white/80 text-sm mt-1">Maintenance Tracker</p>
              <p className="text-white/50 text-xs mt-1 font-medium tracking-wide">
                نظام متابعة الصيانة
              </p>
            </div>

            {/* Form */}
            <div className="px-8 py-7">
              <p className="text-gray-500 text-sm text-center mb-6">
                Enter your employee badge ID to sign in
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="badge" className="text-gray-700 font-medium">
                    Badge ID
                  </Label>
                  <Input
                    id="badge"
                    type="text"
                    placeholder="Enter badge ID"
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    className="text-center text-lg font-mono tracking-widest h-12 border-gray-300"
                    autoFocus
                    autoComplete="off"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium"
                  disabled={loading || !badgeId.trim()}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                  Factory floor access only · Contact supervisor for badge issues
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-white/40 text-xs">
            AlKhudairi Group · Est. 1983
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-6 py-4 text-center"
        style={{ borderTop: '3px solid #1d4ed8' }}
      >
        <p className="text-white/30 text-xs">
          Al Arabi Plastic Factory · Sabhan Industrial, Kuwait · ISO 9001 · ISO 14001 · ISO 45001
        </p>
      </div>
    </div>
  )
}
