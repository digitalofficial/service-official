'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export function PhaseActions({ phaseId, currentStatus }: { phaseId: string; currentStatus: string }) {
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
        throw new Error(d.error || 'Failed to update')
      }
      toast.success(`Phase ${PHASE_STATUSES.find(s => s.value === newStatus)?.label || newStatus}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
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
  )
}
