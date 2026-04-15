'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Check, X } from 'lucide-react'
import { logAudit } from '@/lib/audit'
import { useAuth } from '@/lib/auth-context'
import type { SparePart } from '@/types/database'

function getStockStatus(qty: number, min: number): { label: string; variant: 'success' | 'warning' | 'destructive' } {
  if (qty === 0) return { label: 'CRITICAL', variant: 'destructive' }
  if (qty <= min) return { label: 'LOW', variant: 'warning' }
  return { label: 'OK', variant: 'success' }
}

export function SparesView() {
  const [parts, setParts] = useState<SparePart[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [newPart, setNewPart] = useState({
    part_number: '', name: '', category: '', quantity: 0, min_quantity: 0, unit_cost: 0, location: ''
  })
  const { user } = useAuth()

  async function fetchParts() {
    const { data } = await supabase.from('spare_parts').select('*').order('part_number')
    setParts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchParts() }, [])

  const handleUpdateQty = async (part: SparePart) => {
    await supabase.from('spare_parts').update({ quantity: editQty }).eq('id', part.id)
    await logAudit(user?.id ?? '', 'PART_STOCK_UPDATED', 'spare_part', part.id, {
      part_number: part.part_number,
      old_qty: part.quantity,
      new_qty: editQty,
    })
    setEditingId(null)
    fetchParts()
  }

  const handleAddPart = async () => {
    if (!newPart.part_number || !newPart.name) return
    await supabase.from('spare_parts').insert(newPart)
    setShowAdd(false)
    setNewPart({ part_number: '', name: '', category: '', quantity: 0, min_quantity: 0, unit_cost: 0, location: '' })
    fetchParts()
  }

  const CATEGORIES = ['Electrical', 'Mechanical', 'Pneumatic', 'Sensor', 'Consumable']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spare Parts</h1>
          <p className="text-gray-500 text-sm mt-1">{parts.length} parts · {parts.filter(p => p.quantity <= p.min_quantity).length} low stock</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Part
        </Button>
      </div>

      {/* Add part form */}
      {showAdd && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <h3 className="font-medium text-gray-800">New Spare Part</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <Label className="text-xs">Part #</Label>
              <Input
                value={newPart.part_number}
                onChange={e => setNewPart({ ...newPart, part_number: e.target.value })}
                placeholder="SP016"
                className="h-8 text-sm"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Name</Label>
              <Input
                value={newPart.name}
                onChange={e => setNewPart({ ...newPart, name: e.target.value })}
                placeholder="Part name"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={newPart.category} onValueChange={v => setNewPart({ ...newPart, category: v })}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Cat." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Qty</Label>
              <Input
                type="number" min={0}
                value={newPart.quantity}
                onChange={e => setNewPart({ ...newPart, quantity: parseInt(e.target.value) || 0 })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Min Qty</Label>
              <Input
                type="number" min={0}
                value={newPart.min_quantity}
                onChange={e => setNewPart({ ...newPart, min_quantity: parseInt(e.target.value) || 0 })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Unit Cost ($)</Label>
              <Input
                type="number" min={0} step={0.01}
                value={newPart.unit_cost}
                onChange={e => setNewPart({ ...newPart, unit_cost: parseFloat(e.target.value) || 0 })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Location</Label>
              <Input
                value={newPart.location}
                onChange={e => setNewPart({ ...newPart, location: e.target.value })}
                placeholder="Shelf A1"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddPart}>Add Part</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Part #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden lg:table-cell">Min</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden lg:table-cell">Cost</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide hidden xl:table-cell">Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : parts.map(part => {
                const stock = getStockStatus(part.quantity, part.min_quantity)
                return (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-700">{part.part_number}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{part.name}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{part.category ?? '—'}</td>
                    <td className="px-4 py-3">
                      {editingId === part.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            value={editQty}
                            onChange={e => setEditQty(parseInt(e.target.value) || 0)}
                            className="w-16 h-7 text-xs"
                          />
                          <button onClick={() => handleUpdateQty(part)} className="text-green-600 hover:text-green-700">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold font-mono text-base cursor-pointer hover:underline ${
                              stock.variant === 'destructive' ? 'text-red-600' :
                              stock.variant === 'warning' ? 'text-amber-600' : 'text-gray-900'
                            }`}
                            onClick={() => { setEditingId(part.id); setEditQty(part.quantity) }}
                            title="Click to edit"
                          >
                            {part.quantity}
                          </span>
                          <button onClick={() => { setEditingId(part.id); setEditQty(part.quantity) }}>
                            <Pencil className="w-3 h-3 text-gray-300 hover:text-gray-500" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell font-mono">{part.min_quantity}</td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell font-mono">${part.unit_cost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-500 hidden xl:table-cell text-xs">{part.location ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={stock.variant} className="text-xs">{stock.label}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
