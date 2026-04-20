'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Check, X, Search, ChevronLeft, ChevronRight, AlertTriangle, Package } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { logAudit } from '@/lib/audit'
import { useAuth } from '@/lib/auth-context'
import { useLanguage } from '@/lib/language-context'
import type { SparePart } from '@/types/database'

const PAGE_SIZE = 50
const CATEGORIES = ['Electrical', 'Mechanical', 'Pneumatic', 'Sensor', 'Consumable']

const categoryBadgeColors: Record<string, string> = {
  Electrical: 'bg-blue-100 text-blue-700',
  Mechanical: 'bg-slate-100 text-slate-700',
  Pneumatic: 'bg-sky-100 text-sky-700',
  Sensor: 'bg-amber-100 text-amber-700',
  Consumable: 'bg-green-100 text-green-700',
}

export function SparesView() {
  const [parts, setParts] = useState<SparePart[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Edit inline
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState(0)

  // Detail modal
  const [detailPart, setDetailPart] = useState<SparePart | null>(null)
  const [editCost, setEditCost] = useState('')

  // Add form
  const [showAdd, setShowAdd] = useState(false)
  const [newPart, setNewPart] = useState({
    part_number: '', name: '', category: '', quantity: 0, min_quantity: 0, unit_cost: 0, unit: 'PIECE', location: '', description: ''
  })

  const { user } = useAuth()
  const { t } = useLanguage()

  const fetchParts = useCallback(async () => {
    setLoading(true)
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from('spare_parts')
      .select('*', { count: 'exact' })

    if (categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter)
    }

    if (search.trim()) {
      const s = `%${search.trim()}%`
      query = query.or(`part_number.ilike.${s},name.ilike.${s},description.ilike.${s}`)
    }

    query = query.order('part_number').range(from, to)

    const { data, count } = await query
    setParts((data ?? []) as SparePart[])
    setTotalCount(count ?? 0)
    setLoading(false)
  }, [page, search, categoryFilter])

  useEffect(() => { fetchParts() }, [fetchParts])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [search, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

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

  const handleSaveDetail = async () => {
    if (!detailPart) return
    const cost = parseFloat(editCost)
    if (isNaN(cost) || cost < 0) return
    await supabase.from('spare_parts').update({ unit_cost: cost }).eq('id', detailPart.id)
    await logAudit(user?.id ?? '', 'PART_STOCK_UPDATED', 'spare_part', detailPart.id, {
      part_number: detailPart.part_number,
      field: 'unit_cost',
      old_value: detailPart.unit_cost,
      new_value: cost,
    })
    setDetailPart(null)
    fetchParts()
  }

  const handleAddPart = async () => {
    if (!newPart.part_number || !newPart.name) return
    await supabase.from('spare_parts').insert(newPart)
    setShowAdd(false)
    setNewPart({ part_number: '', name: '', category: '', quantity: 0, min_quantity: 0, unit_cost: 0, unit: 'PIECE', location: '', description: '' })
    fetchParts()
  }

  return (
    <div className="space-y-5">
      <PageHeader icon={Package} title={t('sparesTitle')} subtitle={`${totalCount} ${t('parts')}`}>
        <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-white/15 hover:bg-white/25 text-white border-0">
          <Plus className="w-4 h-4" />
          Add Part
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t('searchParts')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder={t('allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories')}</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Add part form */}
      {showAdd && (
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--app-card)', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}>
          <h3 className="font-medium" style={{ color: 'var(--app-text)' }}>New Spare Part</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <Label className="text-xs">Part #</Label>
              <Input value={newPart.part_number} onChange={e => setNewPart({ ...newPart, part_number: e.target.value })} placeholder="S-XX-XXX" className="h-8 text-sm" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Name</Label>
              <Input value={newPart.name} onChange={e => setNewPart({ ...newPart, name: e.target.value })} placeholder="Part name" className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">{t('category')}</Label>
              <Select value={newPart.category} onValueChange={v => setNewPart({ ...newPart, category: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Cat." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Qty</Label>
              <Input type="number" min={0} value={newPart.quantity} onChange={e => setNewPart({ ...newPart, quantity: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">{t('unit')}</Label>
              <Select value={newPart.unit} onValueChange={v => setNewPart({ ...newPart, unit: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['PIECE', 'MTR', 'SET', 'PACKET', 'CARTON', 'ROLL', 'DRUM', 'KG', 'GRM'].map(u =>
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t('unitCostKWD')}</Label>
              <Input type="number" min={0} step={0.0001} value={newPart.unit_cost} onChange={e => setNewPart({ ...newPart, unit_cost: parseFloat(e.target.value) || 0 })} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Location</Label>
              <Input value={newPart.location} onChange={e => setNewPart({ ...newPart, location: e.target.value })} placeholder="Shelf A1" className="h-8 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddPart}>Add Part</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>{t('cancel')}</Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--app-card)', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b" style={{ borderColor: 'var(--app-card-border)' }}>
              <tr style={{ backgroundColor: 'var(--app-nav-hover)' }}>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--app-text-muted)' }}>Part #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--app-text-muted)' }}>Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden md:table-cell" style={{ color: 'var(--app-text-muted)' }}>{t('category')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--app-text-muted)' }}>Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell" style={{ color: 'var(--app-text-muted)' }}>{t('unitCostKWD')}</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--app-card-border)' }}>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--app-nav-hover)' }} /></td>
                    ))}
                  </tr>
                ))
              ) : parts.map(part => {
                const isAlt = part.part_number.endsWith('-ALT1') || part.part_number.endsWith('-ALT2')
                const catColor = categoryBadgeColors[part.category ?? ''] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                return (
                  <tr key={part.id} className="hover:bg-[var(--app-nav-hover)] cursor-pointer" onClick={() => { setDetailPart(part); setEditCost(part.unit_cost.toFixed(4)) }}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium" style={{ color: 'var(--app-text)' }}>{part.part_number}</span>
                      {isAlt && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                          <AlertTriangle className="w-2.5 h-2.5" />{t('duplicateCode')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <span className="font-medium truncate block" style={{ color: 'var(--app-text)' }} title={part.name}>
                        {part.name.length > 60 ? part.name.substring(0, 57) + '...' : part.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {part.category ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${catColor}`}>{part.category}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {editingId === part.id ? (
                        <div className="flex items-center gap-1">
                          <Input type="number" min={0} value={editQty} onChange={e => setEditQty(parseInt(e.target.value) || 0)} className="w-16 h-7 text-xs" />
                          <button onClick={() => handleUpdateQty(part)} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold font-mono text-base cursor-pointer hover:underline"
                          style={{ color: 'var(--app-text)' }}
                          onClick={(e) => { e.stopPropagation(); setEditingId(part.id); setEditQty(part.quantity) }}
                          title="Click to edit"
                          >
                            {part.quantity}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--app-text-muted)' }}>{part.unit}</span>
                          <button onClick={(e) => { e.stopPropagation(); setEditingId(part.id); setEditQty(part.quantity) }}>
                            <Pencil className="w-3 h-3 text-gray-300 hover:text-gray-500" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono hidden lg:table-cell" style={{ color: 'var(--app-text-muted)' }}>
                      {part.unit_cost > 0 ? `${part.unit_cost.toFixed(2)} KWD` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalCount > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--app-card-border)' }}>
            <p className="text-xs" style={{ color: 'var(--app-text-muted)' }}>
              {t('showing')} {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, totalCount)} {t('of')} {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 px-2">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-mono" style={{ color: 'var(--app-text-muted)' }}>{page}/{totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 px-2">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail / Edit modal */}
      <Dialog open={!!detailPart} onOpenChange={v => !v && setDetailPart(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono">{detailPart?.part_number}</DialogTitle>
          </DialogHeader>
          {detailPart && (
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs" style={{ color: 'var(--app-text-muted)' }}>Name</Label>
                <p className="font-medium" style={{ color: 'var(--app-text)' }}>{detailPart.name}</p>
              </div>
              {detailPart.description && (
                <div>
                  <Label className="text-xs" style={{ color: 'var(--app-text-muted)' }}>{t('description')}</Label>
                  <p className="text-sm" style={{ color: 'var(--app-text)' }}>{detailPart.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs" style={{ color: 'var(--app-text-muted)' }}>{t('category')}</Label>
                  <p className="text-sm" style={{ color: 'var(--app-text)' }}>{detailPart.category ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-xs" style={{ color: 'var(--app-text-muted)' }}>{t('stockCategory')}</Label>
                  <p className="text-sm" style={{ color: 'var(--app-text)' }}>{detailPart.stock_category ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-xs" style={{ color: 'var(--app-text-muted)' }}>{t('unit')}</Label>
                  <p className="text-sm font-mono" style={{ color: 'var(--app-text)' }}>{detailPart.unit}</p>
                </div>
                <div>
                  <Label className="text-xs" style={{ color: 'var(--app-text-muted)' }}>Stock</Label>
                  <p className="text-sm font-mono" style={{ color: 'var(--app-text)' }}>
                    {detailPart.quantity} {detailPart.unit}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-xs" style={{ color: 'var(--app-text-muted)' }}>{t('unitCostKWD')}</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.0001}
                  value={editCost}
                  onChange={e => setEditCost(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveDetail} className="flex-1">Save</Button>
                <Button variant="outline" onClick={() => setDetailPart(null)} className="flex-1">{t('cancel')}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
