'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X, CheckCircle, UserCheck, PlayCircle, AlertTriangle, Wrench, ShieldCheck } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { timeAgo, formatDuration } from '@/lib/format'
import { logAudit } from '@/lib/audit'
import { useAuth } from '@/lib/auth-context'
import { LogIssueModal } from './LogIssueModal'
import type { Operator, SparePart, MaintenanceCategory } from '@/types/database'

type TabFilter = 'all' | 'open' | 'in_progress' | 'resolved'

interface IssueRow {
  id: string
  issue_number: string
  machine_id: string
  type: string
  maintenance_category_code: string | null
  status: string
  description: string
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  downtime: boolean
  reported_by: string | null
  assigned_to: string | null
  resolution: string | null
  reporter?: { name: string } | null
  assignee?: { name: string } | null
}

interface PartEntry { partId: string; quantity: number }

const ISSUE_TYPES = [
  { value: 'breakdown',  label: 'Breakdown',  icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  { value: 'minor',      label: 'Minor',       icon: Wrench,        color: '#b45309', bg: '#fffbeb', border: '#fcd34d' },
  { value: 'preventive', label: 'Preventive',  icon: ShieldCheck,   color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
]

const DISCIPLINES = ['mechanical', 'electrical', 'pneumatic', 'hydraulic', 'facilities']

const typeVariant: Record<string, 'destructive' | 'warning' | 'info'> = {
  breakdown: 'destructive', minor: 'warning', preventive: 'info',
}
const statusVariant: Record<string, 'destructive' | 'warning' | 'success' | 'outline'> = {
  open: 'destructive', in_progress: 'warning', resolved: 'success',
}

interface Props {
  filterByUser?: string
  filterMode?: 'reported' | 'assigned'
}

export function IssuesView({ filterByUser, filterMode }: Props) {
  const [issues, setIssues] = useState<IssueRow[]>([])
  const [tab, setTab] = useState<TabFilter>('open')
  const [loading, setLoading] = useState(true)
  const [logOpen, setLogOpen] = useState(false)

  // Assign state (admin)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState('')
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [technicians, setTechnicians] = useState<Operator[]>([])

  // Resolve state (technician + admin) — expanded form
  const [resolving, setResolving] = useState<string | null>(null)
  const [resolveType, setResolveType] = useState('breakdown')
  const [resolveCategoryCode, setResolveCategoryCode] = useState('')
  const [resolveDescription, setResolveDescription] = useState('')
  const [resolveResolution, setResolveResolution] = useState('')
  const [resolveParts, setResolveParts] = useState<PartEntry[]>([])
  const [resolveSelectedPart, setResolveSelectedPart] = useState('')
  const [resolvePartQty, setResolvePartQty] = useState(1)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  // Lookup data for resolve form
  const [categories, setCategories] = useState<MaintenanceCategory[]>([])
  const [spareParts, setSpareParts] = useState<SparePart[]>([])

  const { user, isAdmin, isTechnician } = useAuth()
  const { t } = useLanguage()

  const canResolve   = isAdmin || isTechnician
  const canAssign    = isAdmin
  const canStartWork = isTechnician

  // Load support data for users who can resolve
  useEffect(() => {
    if (!canResolve) return
    supabase.from('maintenance_categories').select('*').order('code')
      .then(({ data }) => setCategories((data ?? []) as MaintenanceCategory[]))
  }, [canResolve]) // eslint-disable-line react-hooks/exhaustive-deps

  // Search spare parts on demand (2,837 parts — can't load all at once)
  const searchParts = async (q: string) => {
    if (!q.trim()) {
      const { data } = await supabase.from('spare_parts').select('*').order('part_number').limit(20)
      setSpareParts((data ?? []) as SparePart[])
      return
    }
    const s = `%${q.trim()}%`
    const { data } = await supabase
      .from('spare_parts')
      .select('*')
      .or(`part_number.ilike.${s},name.ilike.${s},description.ilike.${s}`)
      .order('part_number')
      .limit(20)
    setSpareParts((data ?? []) as SparePart[])
  }

  // Initial load of first 20 parts
  useEffect(() => {
    if (!canResolve) return
    searchParts('')
  }, [canResolve]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load technicians for admin assign dropdown
  useEffect(() => {
    if (!isAdmin) return
    supabase.from('operators').select('*').eq('role', 'technician').eq('is_active', true).order('name')
      .then(({ data }) => setTechnicians((data ?? []) as Operator[]))
  }, [isAdmin])

  async function fetchIssues() {
    let query = supabase
      .from('issues')
      .select(`
        id, issue_number, machine_id, type, maintenance_category_code,
        status, description, start_time, end_time, duration_minutes, downtime,
        reported_by, assigned_to, resolution,
        reporter:operators!issues_reported_by_fkey(name),
        assignee:operators!issues_assigned_to_fkey(name)
      `)
      .order('start_time', { ascending: false })

    if (filterByUser) {
      if (filterMode === 'assigned') query = query.eq('assigned_to', filterByUser)
      else if (filterMode === 'reported') query = query.eq('reported_by', filterByUser)
      else query = query.or(`reported_by.eq.${filterByUser},assigned_to.eq.${filterByUser}`)
    }
    if (tab !== 'all') query = query.eq('status', tab)

    const { data } = await query.limit(100)
    setIssues((data ?? []) as unknown as IssueRow[])
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    fetchIssues()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filterByUser, filterMode])

  function openResolveForm(issue: IssueRow) {
    setResolving(issue.id)
    setResolveType(issue.type || 'breakdown')
    setResolveCategoryCode(issue.maintenance_category_code ?? '')
    setResolveDescription(issue.description ?? '')
    setResolveResolution('')
    setResolveParts([])
    setResolveSelectedPart('')
    setResolvePartQty(1)
    setAssigning(null)
  }

  function closeResolveForm() {
    setResolving(null)
    setResolveType('breakdown')
    setResolveCategoryCode('')
    setResolveDescription('')
    setResolveResolution('')
    setResolveParts([])
  }

  function addResolvePart() {
    if (!resolveSelectedPart) return
    const existing = resolveParts.find(p => p.partId === resolveSelectedPart)
    if (existing) {
      setResolveParts(resolveParts.map(p =>
        p.partId === resolveSelectedPart ? { ...p, quantity: p.quantity + resolvePartQty } : p
      ))
    } else {
      setResolveParts([...resolveParts, { partId: resolveSelectedPart, quantity: resolvePartQty }])
    }
    setResolveSelectedPart('')
    setResolvePartQty(1)
  }

  const handleResolve = async (issueId: string) => {
    if (!resolveDescription.trim()) return
    setResolvingId(issueId)

    await supabase.from('issues').update({
      status:                    'resolved',
      end_time:                  new Date().toISOString(),
      type:                      resolveType as 'breakdown' | 'minor' | 'preventive',
      maintenance_category_code: resolveCategoryCode || null,
      description:               resolveDescription.trim(),
      resolution:                resolveResolution.trim() || null,
    }).eq('id', issueId)

    // Insert spare parts used
    if (resolveParts.length > 0) {
      await supabase.from('issue_parts').insert(
        resolveParts.map(p => ({ issue_id: issueId, part_id: p.partId, quantity_used: p.quantity }))
      )
    }

    await logAudit(user?.id ?? '', 'ISSUE_RESOLVED', 'issue', issueId, {
      type: resolveType, category: resolveCategoryCode, description: resolveDescription.trim(),
    })

    closeResolveForm()
    setResolvingId(null)
    fetchIssues()
  }

  const handleStartWork = async (issueId: string) => {
    await supabase.from('issues').update({ status: 'in_progress' }).eq('id', issueId)
    await logAudit(user?.id ?? '', 'ISSUE_UPDATED', 'issue', issueId, { status: 'in_progress' })
    fetchIssues()
  }

  const handleAssign = async (issueId: string) => {
    if (!assignTarget) return
    setAssigningId(issueId)
    await supabase.from('issues').update({ assigned_to: assignTarget, status: 'in_progress' }).eq('id', issueId)
    await logAudit(user?.id ?? '', 'ISSUE_ASSIGNED', 'issue', issueId, { assigned_to: assignTarget })
    setAssigning(null)
    setAssignTarget('')
    setAssigningId(null)
    fetchIssues()
  }

  const TABS: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
  ]

  const pageTitle = filterByUser
    ? isTechnician ? 'My Work Orders' : 'My Issues'
    : 'Issues'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--app-text)' }}>{pageTitle}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--app-text-muted)' }}>{issues.length} issues shown</p>
        </div>
        <Button onClick={() => setLogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('logIssue')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit overflow-x-auto" style={{ backgroundColor: 'var(--app-nav-hover)' }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              tab === key ? 'shadow-sm' : ''
            }`}
            style={tab === key ? { backgroundColor: 'var(--app-card)', color: 'var(--app-text)' } : { color: 'var(--app-text-muted)' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--app-nav-hover)' }} />
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--app-text-muted)' }}>
          <CheckCircle className="w-10 h-10 mx-auto mb-3" />
          <p>No issues found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map(issue => (
            <div key={issue.id} className="rounded-lg border p-4"
              style={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-card-border)' }}>

              {/* Issue header */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-mono text-sm font-bold" style={{ color: 'var(--app-text)' }}>{issue.issue_number}</span>
                    <span className="font-mono text-sm font-medium text-[#1d4ed8]">{issue.machine_id}</span>
                    {issue.description && (
                      <Badge variant={typeVariant[issue.type] ?? 'outline'} className="text-xs">{issue.type}</Badge>
                    )}
                    <Badge variant={statusVariant[issue.status] ?? 'outline'} className="text-xs">
                      {issue.status.replace('_', ' ')}
                    </Badge>
                    {issue.downtime && <Badge variant="destructive" className="text-xs">DOWNTIME</Badge>}
                    {issue.maintenance_category_code && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--app-nav-hover)', color: 'var(--app-text-muted)' }}>
                        {issue.maintenance_category_code}
                      </span>
                    )}
                  </div>

                  {/* Description — if empty show pending label */}
                  {issue.description
                    ? <p className="text-sm" style={{ color: 'var(--app-text)' }}>{issue.description}</p>
                    : <p className="text-sm italic" style={{ color: 'var(--app-text-muted)' }}>Awaiting technician assessment</p>
                  }

                  <div className="flex flex-wrap gap-4 mt-1.5 text-xs" style={{ color: 'var(--app-text-muted)' }}>
                    <span>Reported: {timeAgo(issue.start_time)}</span>
                    {issue.end_time && <span>Duration: {formatDuration(issue.duration_minutes ?? 0)}</span>}
                    {issue.reporter && <span>By: <span className="font-medium">{(issue.reporter as any).name}</span></span>}
                    {issue.assignee && <span>Assigned: <span className="font-medium text-[#1d4ed8]">{(issue.assignee as any).name}</span></span>}
                  </div>

                  {issue.resolution && (
                    <div className="mt-2 text-xs bg-green-50 border border-green-100 rounded px-2 py-1.5 text-green-700">
                      <span className="font-medium">Resolution:</span> {issue.resolution}
                    </div>
                  )}
                </div>

                {/* Action buttons — shown when not in an expanded form for this issue */}
                {issue.status !== 'resolved' && resolving !== issue.id && assigning !== issue.id && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {canStartWork && issue.status === 'open' && (
                      <Button size="sm" variant="outline"
                        className="text-xs gap-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                        onClick={() => handleStartWork(issue.id)}>
                        <PlayCircle className="w-3 h-3" /> Start Work
                      </Button>
                    )}
                    {canAssign && (
                      <Button size="sm" variant="outline"
                        className="text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => { setAssigning(issue.id); setResolving(null) }}>
                        <UserCheck className="w-3 h-3" /> Assign
                      </Button>
                    )}
                    {canResolve && (
                      <Button size="sm" variant="outline"
                        className="text-xs gap-1 border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => openResolveForm(issue)}>
                        <CheckCircle className="w-3 h-3" /> Resolve
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* ── Assign form ─────────────────────────────────────────────── */}
              {assigning === issue.id && (
                <div className="mt-3 pt-3 border-t flex flex-col gap-2 max-w-xs" style={{ borderColor: 'var(--app-card-border)' }}>
                  <Select value={assignTarget} onValueChange={setAssignTarget}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select technician..." />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <span className="font-mono">{t.id}</span> — {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 text-xs h-7"
                      onClick={() => handleAssign(issue.id)}
                      disabled={!assignTarget || assigningId === issue.id}>
                      {assigningId === issue.id ? '...' : 'Assign'}
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7"
                      onClick={() => { setAssigning(null); setAssignTarget('') }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Resolve form ─────────────────────────────────────────────── */}
              {resolving === issue.id && (
                <div className="mt-3 pt-3 border-t space-y-3" style={{ borderColor: 'var(--app-card-border)' }}>

                  {/* Issue Type */}
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--app-text-muted)' }}>Issue Type *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {ISSUE_TYPES.map(({ value, label, icon: Icon, color, bg, border }) => (
                        <button key={value} type="button"
                          onClick={() => setResolveType(value)}
                          className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                            resolveType === value ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: bg, borderColor: resolveType === value ? color : border, color }}>
                          <Icon className="w-3.5 h-3.5" />{label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Work Order Category */}
                  <div>
                    <Label className="text-xs font-medium mb-1 block" style={{ color: 'var(--app-text-muted)' }}>Work Order Category</Label>
                    <Select value={resolveCategoryCode || '__none__'}
                      onValueChange={v => setResolveCategoryCode(v === '__none__' ? '' : v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {DISCIPLINES.map(disc => {
                          const cats = categories.filter(c => c.discipline === disc)
                          if (!cats.length) return null
                          return (
                            <div key={disc}>
                              <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">{disc}</div>
                              {cats.map(c => (
                                <SelectItem key={c.code} value={c.code}>
                                  <span className="font-mono text-gray-500">{c.code}</span> — {c.description}
                                </SelectItem>
                              ))}
                            </div>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Work Description */}
                  <div>
                    <Label className="text-xs font-medium mb-1 block" style={{ color: 'var(--app-text-muted)' }}>Work Description *</Label>
                    <Textarea placeholder="Describe what was found and what work was done..."
                      value={resolveDescription}
                      onChange={e => setResolveDescription(e.target.value)}
                      rows={2} className="text-xs" />
                  </div>

                  {/* Resolution Notes */}
                  <div>
                    <Label className="text-xs font-medium mb-1 block" style={{ color: 'var(--app-text-muted)' }}>Resolution Notes</Label>
                    <Textarea placeholder="Any additional notes, follow-up actions... (optional)"
                      value={resolveResolution}
                      onChange={e => setResolveResolution(e.target.value)}
                      rows={2} className="text-xs" />
                  </div>

                  {/* Spare Parts Used */}
                  <div>
                    <Label className="text-xs font-medium mb-1 block" style={{ color: 'var(--app-text-muted)' }}>Spare Parts Used</Label>
                    <Input
                      placeholder="Search parts by number, name, or description..."
                      onChange={e => searchParts(e.target.value)}
                      className="h-8 text-xs mb-2"
                    />
                    <div className="flex gap-2">
                      <Select value={resolveSelectedPart} onValueChange={setResolveSelectedPart}>
                        <SelectTrigger className="flex-1 h-8 text-xs">
                          <SelectValue placeholder="Select part..." />
                        </SelectTrigger>
                        <SelectContent>
                          {spareParts.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              <span className="font-mono">{p.part_number}</span> — {p.name} ({p.quantity} {(p as any).unit ?? 'PIECE'} in stock)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="number" min={1} value={resolvePartQty}
                        onChange={e => setResolvePartQty(parseInt(e.target.value) || 1)}
                        className="w-14 h-8 text-xs" />
                      <Button type="button" size="sm" variant="outline" className="h-8 px-2"
                        onClick={addResolvePart} disabled={!resolveSelectedPart}>
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {resolveParts.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {resolveParts.map(p => {
                          const part = spareParts.find(sp => sp.id === p.partId)
                          return (
                            <div key={p.partId} className="flex items-center justify-between rounded px-2 py-1.5 text-xs" style={{ backgroundColor: 'var(--app-nav-hover)' }}>
                              <span>
                                <span className="font-mono" style={{ color: 'var(--app-text-muted)' }}>{part?.part_number}</span>
                                {' '}{part?.name} × {p.quantity}
                              </span>
                              <button onClick={() => setResolveParts(resolveParts.filter(x => x.partId !== p.partId))}
                                className="text-gray-400 hover:text-red-500 ml-2">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="flex-1 text-xs"
                      onClick={() => handleResolve(issue.id)}
                      disabled={!resolveDescription.trim() || resolvingId === issue.id}>
                      {resolvingId === issue.id ? 'Saving...' : 'Mark Resolved'}
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs" onClick={closeResolveForm}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      <LogIssueModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        reportedBy={user?.id ?? ''}
        onSuccess={() => { setLogOpen(false); fetchIssues() }}
      />
    </div>
  )
}
