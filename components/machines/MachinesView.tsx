'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Plus } from 'lucide-react'
import type { Machine, Category } from '@/types/database'
import { MachineDetailPanel } from './MachineDetailPanel'
import { LogIssueModal } from '../issues/LogIssueModal'
import { useAuth } from '@/lib/auth-context'

type MachineWithCategory = Machine & { categories: { name: string } | null }

const statusConfig: Record<string, { dot: string; badge: string; variant: 'default' | 'destructive' | 'warning' | 'info' }> = {
  'Running': { dot: 'bg-[#16a34a]', badge: 'Running', variant: 'default' },
  'Down': { dot: 'bg-[#dc2626] animate-pulse', badge: 'Down', variant: 'destructive' },
  'Maintenance': { dot: 'bg-[#b45309]', badge: 'Maintenance', variant: 'warning' },
  'Minor Issue': { dot: 'bg-[#1d4ed8]', badge: 'Minor Issue', variant: 'info' },
}

export function MachinesView() {
  const [machines, setMachines] = useState<MachineWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<MachineWithCategory | null>(null)
  const [logIssueOpen, setLogIssueOpen] = useState(false)
  const [logIssueMachine, setLogIssueMachine] = useState<string>('')
  const { user } = useAuth()

  useEffect(() => {
    async function fetchData() {
      const [mRes, cRes] = await Promise.all([
        supabase.from('machines').select('*, categories(name)').order('id'),
        supabase.from('categories').select('*').order('name'),
      ])
      setMachines((mRes.data ?? []) as MachineWithCategory[])
      setCategories(cRes.data ?? [])
      setLoading(false)
    }
    fetchData()

    const channel = supabase
      .channel('machines-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, fetchData)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = machines.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = !q || (
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      (m.model ?? '').toLowerCase().includes(q) ||
      (m.manufacturer ?? '').toLowerCase().includes(q)
    )
    const matchCat = categoryFilter === 'all' || m.category_id === categoryFilter
    return matchSearch && matchCat
  })

  const handleLogIssue = (machineId: string) => {
    setLogIssueMachine(machineId)
    setLogIssueOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--app-text)' }}>Machines</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>{machines.length} machines · {filtered.length} shown</p>
        </div>
        <Button onClick={() => handleLogIssue('')} className="gap-2">
          <Plus className="w-4 h-4" />
          Log Issue
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by ID, name, model, manufacturer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 rounded-lg border overflow-hidden" style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b" style={{ backgroundColor: 'var(--app-nav-hover)', borderColor: 'var(--app-card-border)' }}>
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--app-text-muted)' }}>ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--app-text-muted)' }}>Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide hidden md:table-cell" style={{ color: 'var(--app-text-muted)' }}>Model</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide hidden lg:table-cell" style={{ color: 'var(--app-text-muted)' }}>Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide hidden xl:table-cell" style={{ color: 'var(--app-text-muted)' }}>Manufacturer</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--app-text-muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--app-card-border)' }}>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--app-nav-hover)' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.map(machine => {
                  const cfg = statusConfig[machine.status] ?? statusConfig['Running']
                  const isSelected = selected?.id === machine.id
                  return (
                    <tr
                      key={machine.id}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelected(isSelected ? null : machine)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium" style={{ color: 'var(--app-text)' }}>{machine.id}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: 'var(--app-text)' }}>{machine.name}</td>
                      <td className="px-4 py-3 hidden md:table-cell font-mono text-xs" style={{ color: 'var(--app-text-muted)' }}>{machine.model ?? '—'}</td>
                      <td className="px-4 py-3 hidden lg:table-cell" style={{ color: 'var(--app-text-muted)' }}>{machine.categories?.name ?? '—'}</td>
                      <td className="px-4 py-3 hidden xl:table-cell" style={{ color: 'var(--app-text-muted)' }}>{machine.manufacturer ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                          <Badge variant={cfg.variant} className="text-xs">{cfg.badge}</Badge>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--app-text-muted)' }}>
              No machines match your filters
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <MachineDetailPanel
            machine={selected}
            onClose={() => setSelected(null)}
            onLogIssue={() => handleLogIssue(selected.id)}
          />
        )}
      </div>

      <LogIssueModal
        open={logIssueOpen}
        onClose={() => setLogIssueOpen(false)}
        defaultMachineId={logIssueMachine}
        reportedBy={user?.id ?? ''}
        onSuccess={() => {
          setLogIssueOpen(false)
          // refresh handled by realtime
        }}
      />
    </div>
  )
}
