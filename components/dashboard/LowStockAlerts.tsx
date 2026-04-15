'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Package, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

interface PartRow {
  id: string
  part_number: string
  name: string
  quantity: number
  min_quantity: number
}

export function LowStockAlerts() {
  const [parts, setParts] = useState<PartRow[]>([])
  const [loading, setLoading] = useState(true)
  const { isAdmin } = useAuth()

  useEffect(() => {
    supabase
      .from('spare_parts')
      .select('id, part_number, name, quantity, min_quantity')
      .then(({ data }) => {
        const lowStock = (data ?? []).filter(p => p.quantity <= p.min_quantity)
        setParts(lowStock.slice(0, 6))
        setLoading(false)
      })
  }, [])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Low Stock Alerts</h2>
        {isAdmin && (
          <Link href="/spares" className="text-xs text-[#0d7a3e] hover:underline">
            Manage →
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : parts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Package className="w-8 h-8 mb-2" />
          <p className="text-sm">All parts adequately stocked</p>
        </div>
      ) : (
        <div className="space-y-2">
          {parts.map(part => {
            const isCritical = part.quantity === 0
            return (
              <div
                key={part.id}
                className={`flex items-center justify-between gap-3 p-3 rounded-md ${
                  isCritical ? 'bg-red-50' : 'bg-amber-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle
                    className={`w-4 h-4 flex-shrink-0 ${isCritical ? 'text-red-500' : 'text-amber-500'}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{part.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{part.part_number}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className={`text-lg font-bold font-mono ${isCritical ? 'text-red-600' : 'text-amber-600'}`}
                  >
                    {part.quantity}
                  </div>
                  <div className="text-xs text-gray-400">min {part.min_quantity}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
