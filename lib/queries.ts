import { supabase } from './supabase'
import type { SparePart } from '@/types/database'

// ─── Spare Parts ─────────────────────────────────────────────────────────────

export type StockStatus = 'all' | 'in_stock' | 'low' | 'critical' | 'out'

interface SparePartsFilters {
  category?: string
  status?: StockStatus
  search?: string
  page: number
  pageSize: number
}

interface PaginatedResult<T> {
  data: T[]
  count: number
}

export async function getSparePartsPaginated(
  filters: SparePartsFilters
): Promise<PaginatedResult<SparePart>> {
  const { category, status, search, page, pageSize } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('spare_parts')
    .select('*', { count: 'exact' })

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  if (status && status !== 'all') {
    switch (status) {
      case 'in_stock':
        query = query.gt('quantity', 0).gt('quantity', 0) // supabase doesn't have a raw "qty > min_qty" filter easily, so we handle post-query; use gt(quantity, 0) as base
        break
      case 'low':
        // quantity > 0 AND quantity <= min_quantity
        query = query.gt('quantity', 0)
        break
      case 'critical':
        query = query.eq('quantity', 0)
        break
      case 'out':
        query = query.eq('quantity', 0)
        break
    }
  }

  if (search && search.trim()) {
    const s = `%${search.trim()}%`
    query = query.or(`part_number.ilike.${s},name.ilike.${s},description.ilike.${s}`)
  }

  query = query.order('part_number').range(from, to)

  const { data, count, error } = await query
  if (error) return { data: [], count: 0 }

  let filtered = (data ?? []) as SparePart[]

  // Post-filter for low stock (quantity > 0 AND quantity <= min_quantity)
  // since Supabase can't compare two columns easily
  if (status === 'low') {
    filtered = filtered.filter(p => p.quantity <= p.min_quantity)
  }
  if (status === 'in_stock') {
    filtered = filtered.filter(p => p.quantity > p.min_quantity)
  }

  return { data: filtered, count: count ?? 0 }
}

export async function searchSparePartsForCombobox(
  query: string,
  limit = 20
): Promise<SparePart[]> {
  const s = `%${query.trim()}%`
  const { data } = await supabase
    .from('spare_parts')
    .select('*')
    .or(`part_number.ilike.${s},name.ilike.${s},description.ilike.${s}`)
    .order('part_number')
    .limit(limit)
  return (data ?? []) as SparePart[]
}

export async function getLowStockParts(limit = 5): Promise<SparePart[]> {
  // Get parts where quantity <= min_quantity, ordered by quantity ascending
  const { data } = await supabase
    .from('spare_parts')
    .select('*')
    .lte('quantity', 5) // cast a wide net, filter client-side
    .order('quantity', { ascending: true })
    .limit(100)

  const parts = (data ?? []) as SparePart[]
  return parts
    .filter(p => p.quantity <= p.min_quantity)
    .slice(0, limit)
}

export async function getSparePartsUsageReport(
  startDate: string,
  endDate: string
): Promise<{
  byCategory: { category: string; stock_category: string | null; total_used: number; total_cost: number }[]
  topConsumed: { part_number: string; name: string; category: string | null; total_used: number; unit_cost: number }[]
}> {
  const { data: issueParts } = await supabase
    .from('issue_parts')
    .select(`
      quantity_used,
      created_at,
      spare_parts(part_number, name, category, stock_category, unit_cost)
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  const rows = (issueParts ?? []) as unknown as Array<{
    quantity_used: number
    spare_parts: { part_number: string; name: string; category: string | null; stock_category: string | null; unit_cost: number } | null
  }>

  // Group by category + stock_category
  const catMap: Record<string, { category: string; stock_category: string | null; total_used: number; total_cost: number }> = {}
  const partMap: Record<string, { part_number: string; name: string; category: string | null; total_used: number; unit_cost: number }> = {}

  for (const row of rows) {
    const sp = row.spare_parts as any
    if (!sp) continue
    const cat = sp.category ?? 'Unknown'
    const sc = sp.stock_category ?? null
    const key = `${cat}::${sc}`
    if (!catMap[key]) catMap[key] = { category: cat, stock_category: sc, total_used: 0, total_cost: 0 }
    catMap[key].total_used += row.quantity_used
    catMap[key].total_cost += row.quantity_used * (sp.unit_cost ?? 0)

    const pkey = sp.part_number
    if (!partMap[pkey]) partMap[pkey] = { part_number: sp.part_number, name: sp.name, category: sp.category, total_used: 0, unit_cost: sp.unit_cost }
    partMap[pkey].total_used += row.quantity_used
  }

  return {
    byCategory: Object.values(catMap).sort((a, b) => b.total_cost - a.total_cost),
    topConsumed: Object.values(partMap).sort((a, b) => b.total_used - a.total_used).slice(0, 10),
  }
}
