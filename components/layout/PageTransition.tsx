'use client'

import { useEffect, useState } from 'react'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  return (
    <div
      className="transition-all duration-[350ms] ease-out"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      {children}
    </div>
  )
}
