'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X, AlertTriangle, Wrench, ShieldCheck } from 'lucide-react'
import { logAudit } from '@/lib/audit'
import type { SparePart, Operator } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  defaultMachineId?: string
  reportedBy: string
  onSuccess: () => void
}

interface MachineOption { id: string; name: string }

interface PartEntry {
  partId: string
  quantity: number
}

const ISSUE_TYPES = [
  { value: 'breakdown', label: 'Breakdown', icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  { value: 'minor', label: 'Minor Issue', icon: Wrench, color: '#b45309', bg: '#fffbeb', border: '#fcd34d' },
  { value: 'preventive', label: 'Preventive', icon: ShieldCheck, color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
]

export function LogIssueModal({ open, onClose, defaultMachineId, reportedBy, onSuccess }: Props) {
  const [machines, setMachines] = useState<MachineOption[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [spareParts, setSpareParts] = useState<SparePart[]>([])
  const [machineId, setMachineId] = useState(defaultMachineId ?? '')
  const [machineSearch, setMachineSearch] = useState('')
  const [issueType, setIssueType] = useState<string>('breakdown')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [parts, setParts] = useState<PartEntry[]>([])
  const [selectedPart, setSelectedPart] = useState('')
  const [partQty, setPartQty] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setMachineId(defaultMachineId ?? '')
    setMachineSearch('')
    setIssueType('breakdown')
    setDescription('')
    setAssignedTo('')
    setParts([])
    setError('')

    Promise.all([
      supabase.from('machines').select('id, name').order('id'),
      supabase.from('operators').select('*').eq('is_active', true).order('name'),
      supabase.from('spare_parts').select('*').order('name'),
    ]).then(([m, o, s]) => {
      setMachines(m.data ?? [])
      setOperators(o.data ?? [])
      setSpareParts(s.data ?? [])
    })
  }, [open, defaultMachineId])

  const filteredMachines = machines.filter(m =>
    !machineSearch || m.id.toLowerCase().includes(machineSearch.toLowerCase()) ||
    m.name.toLowerCase().includes(machineSearch.toLowerCase())
  )

  const addPart = () => {
    if (!selectedPart) return
    const existing = parts.find(p => p.partId === selectedPart)
    if (existing) {
      setParts(parts.map(p => p.partId === selectedPart ? { ...p, quantity: p.quantity + partQty } : p))
    } else {
      setParts([...parts, { partId: selectedPart, quantity: partQty }])
    }
    setSelectedPart('')
    setPartQty(1)
  }

  const removePart = (partId: string) => {
    setParts(parts.filter(p => p.partId !== partId))
  }

  const handleSubmit = async () => {
    if (!machineId || !description.trim()) {
      setError('Machine and description are required')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      // Create issue
      const { data: issue, error: issueError } = await supabase
        .from('issues')
        .insert({
          machine_id: machineId,
          type: issueType as 'breakdown' | 'minor' | 'preventive',
          description: description.trim(),
          reported_by: reportedBy,
          assigned_to: assignedTo || null,
          downtime: issueType === 'breakdown',
          status: 'open',
        })
        .select()
        .single()

      if (issueError || !issue) throw issueError ?? new Error('Failed to create issue')

      // Add parts if any
      if (parts.length > 0) {
        await supabase.from('issue_parts').insert(
          parts.map(p => ({
            issue_id: issue.id,
            part_id: p.partId,
            quantity_used: p.quantity,
          }))
        )
      }

      // Audit log
      await logAudit(reportedBy, 'ISSUE_CREATED', 'issue', issue.id, {
        issue_number: issue.issue_number,
        machine_id: machineId,
        type: issueType,
      })

      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create issue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log New Issue</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Machine selector */}
          <div className="space-y-2">
            <Label>Machine *</Label>
            <Input
              placeholder="Search machine ID or name..."
              value={machineSearch}
              onChange={e => setMachineSearch(e.target.value)}
              className="mb-1"
            />
            <Select value={machineId} onValueChange={setMachineId}>
              <SelectTrigger>
                <SelectValue placeholder="Select machine" />
              </SelectTrigger>
              <SelectContent>
                {filteredMachines.slice(0, 50).map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="font-mono">{m.id}</span> — {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Issue type toggle */}
          <div className="space-y-2">
            <Label>Issue Type *</Label>
            <div className="grid grid-cols-3 gap-2">
              {ISSUE_TYPES.map(({ value, label, icon: Icon, color, bg, border }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setIssueType(value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-xs font-medium transition-all ${
                    issueType === value ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: bg,
                    borderColor: issueType === value ? color : border,
                    color,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              placeholder="Describe the issue..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Assign to */}
          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select value={assignedTo || '__none__'} onValueChange={v => setAssignedTo(v === '__none__' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select operator (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                {operators.map(op => (
                  <SelectItem key={op.id} value={op.id}>
                    <span className="font-mono">{op.id}</span> — {op.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Spare parts */}
          <div className="space-y-2">
            <Label>Spare Parts Used</Label>
            <div className="flex gap-2">
              <Select value={selectedPart} onValueChange={setSelectedPart}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select part" />
                </SelectTrigger>
                <SelectContent>
                  {spareParts.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="font-mono">{p.part_number}</span> — {p.name} (qty: {p.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                value={partQty}
                onChange={e => setPartQty(parseInt(e.target.value) || 1)}
                className="w-16"
              />
              <Button type="button" variant="outline" onClick={addPart} disabled={!selectedPart}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {parts.length > 0 && (
              <div className="space-y-1 mt-2">
                {parts.map(p => {
                  const part = spareParts.find(sp => sp.id === p.partId)
                  return (
                    <div key={p.partId} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
                      <span>
                        <span className="font-mono text-gray-500">{part?.part_number}</span>
                        {' '}{part?.name} × {p.quantity}
                      </span>
                      <button onClick={() => removePart(p.partId)} className="text-gray-400 hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? 'Submitting...' : 'Log Issue'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
