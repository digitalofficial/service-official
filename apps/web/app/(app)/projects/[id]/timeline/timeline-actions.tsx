'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
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

export function PhaseStatusActions({ phaseId, currentStatus }: { phaseId: string; currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleChange(newStatus: string) {
    if (newStatus === currentStatus) return
    setLoading(true)
    try {
      const res = await fetch('/api/projects/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'phase', item_id: phaseId, status: newStatus }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed')
      }
      toast.success(`Phase updated`)
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!confirm('Delete this phase?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/items?type=phase&item_id=${phaseId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Phase deleted')
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentStatus}
        onChange={e => handleChange(e.target.value)}
        disabled={loading}
        className={`text-xs font-medium border rounded-full px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 cursor-pointer ${STATUS_COLORS[currentStatus] ?? STATUS_COLORS.not_started}`}
      >
        {PHASE_STATUSES.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <button onClick={handleDelete} disabled={loading} className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-50" title="Delete">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}

export function MilestoneToggle({ milestoneId, isCompleted }: { milestoneId: string; isCompleted: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    try {
      const res = await fetch('/api/projects/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'milestone', item_id: milestoneId, is_completed: !isCompleted }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed')
      }
      toast.success(isCompleted ? 'Milestone reopened' : 'Milestone completed')
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  async function handleDelete() {
    if (!confirm('Delete this milestone?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/items?type=milestone&item_id=${milestoneId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Milestone deleted')
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-colors disabled:opacity-50 ${
          isCompleted ? 'bg-green-50 border-green-400 text-green-700' : 'border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-600'
        }`}
      >
        {isCompleted ? 'Completed' : 'Mark Complete'}
      </button>
      <button onClick={handleDelete} disabled={loading} className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-50" title="Delete">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}
