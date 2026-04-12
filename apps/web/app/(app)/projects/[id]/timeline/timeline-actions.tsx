'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2, Pencil, X, Check } from 'lucide-react'
import { toast } from 'sonner'

const PHASE_STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
]

const STATUS_COLORS: Record<string, string> = {
  not_started: 'border-gray-300 text-gray-600',
  in_progress: 'border-blue-400 text-blue-700 bg-blue-50',
  completed: 'border-green-400 text-green-700 bg-green-50',
  on_hold: 'border-amber-400 text-amber-700 bg-amber-50',
}

async function patchItem(type: string, itemId: string, updates: Record<string, any>) {
  const res = await fetch('/api/projects/items', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, item_id: itemId, ...updates }),
  })
  if (!res.ok) {
    const d = await res.json().catch(() => ({}))
    throw new Error(d.error || 'Failed to update')
  }
  return res.json()
}

interface PhaseData {
  id: string
  name: string
  description?: string
  start_date?: string
  end_date?: string
  status: string
}

export function PhaseStatusActions({ phase }: { phase: PhaseData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: phase.name,
    description: phase.description || '',
    start_date: phase.start_date || '',
    end_date: phase.end_date || '',
  })

  async function handleStatusChange(newStatus: string) {
    if (newStatus === phase.status) return
    setLoading(true)
    try {
      await patchItem('phase', phase.id, { status: newStatus })
      toast.success('Phase updated')
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  async function handleSave() {
    setLoading(true)
    try {
      const updates: Record<string, any> = {}
      if (form.name !== phase.name) updates.name = form.name
      if (form.description !== (phase.description || '')) updates.description = form.description || null
      if (form.start_date !== (phase.start_date || '')) updates.start_date = form.start_date || null
      if (form.end_date !== (phase.end_date || '')) updates.end_date = form.end_date || null

      if (Object.keys(updates).length > 0) {
        await patchItem('phase', phase.id, updates)
        toast.success('Phase updated')
        router.refresh()
      }
      setEditing(false)
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!confirm('Delete this phase?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/items?type=phase&item_id=${phase.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Phase deleted')
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  if (editing) {
    return (
      <div className="w-full mt-2 space-y-2 border-t border-gray-100 pt-2">
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
          placeholder="Phase name"
          autoFocus
        />
        <input
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
          placeholder="Description (optional)"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={form.start_date}
            onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
          />
          <input
            type="date"
            value={form.end_date}
            onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex justify-end gap-1">
          <button onClick={() => { setEditing(false); setForm({ name: phase.name, description: phase.description || '', start_date: phase.start_date || '', end_date: phase.end_date || '' }) }} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
          <button onClick={handleSave} disabled={loading || !form.name} className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={phase.status}
        onChange={e => handleStatusChange(e.target.value)}
        disabled={loading}
        className={`text-xs font-medium border rounded-full px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 cursor-pointer ${STATUS_COLORS[phase.status] ?? STATUS_COLORS.not_started}`}
      >
        {PHASE_STATUSES.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <button onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-blue-500" title="Edit">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={handleDelete} disabled={loading} className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-50" title="Delete">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}

interface MilestoneData {
  id: string
  name: string
  description?: string
  due_date?: string
  is_completed?: boolean
}

export function MilestoneToggle({ milestone }: { milestone: MilestoneData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: milestone.name,
    description: milestone.description || '',
    due_date: milestone.due_date || '',
  })

  async function handleToggle() {
    setLoading(true)
    try {
      await patchItem('milestone', milestone.id, { is_completed: !milestone.is_completed })
      toast.success(milestone.is_completed ? 'Milestone reopened' : 'Milestone completed')
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  async function handleSave() {
    setLoading(true)
    try {
      const updates: Record<string, any> = {}
      if (form.name !== milestone.name) updates.name = form.name
      if (form.description !== (milestone.description || '')) updates.description = form.description || null
      if (form.due_date !== (milestone.due_date || '')) updates.due_date = form.due_date || null

      if (Object.keys(updates).length > 0) {
        await patchItem('milestone', milestone.id, updates)
        toast.success('Milestone updated')
        router.refresh()
      }
      setEditing(false)
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!confirm('Delete this milestone?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/items?type=milestone&item_id=${milestone.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Milestone deleted')
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  if (editing) {
    return (
      <div className="w-full mt-2 space-y-2 border-t border-gray-100 pt-2">
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
          placeholder="Milestone name"
          autoFocus
        />
        <input
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
          placeholder="Description (optional)"
        />
        <input
          type="date"
          value={form.due_date}
          onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
        />
        <div className="flex justify-end gap-1">
          <button onClick={() => { setEditing(false); setForm({ name: milestone.name, description: milestone.description || '', due_date: milestone.due_date || '' }) }} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
          <button onClick={handleSave} disabled={loading || !form.name} className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-colors disabled:opacity-50 ${
          milestone.is_completed ? 'bg-green-50 border-green-400 text-green-700' : 'border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-600'
        }`}
      >
        {milestone.is_completed ? 'Completed' : 'Mark Complete'}
      </button>
      <button onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-blue-500" title="Edit">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={handleDelete} disabled={loading} className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-50" title="Delete">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}
