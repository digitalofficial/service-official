'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ItemActionsProps {
  itemId: string
  itemType: string
  currentStatus: string
  statuses: { value: string; label: string }[]
  onDeleted?: () => void
}

export function ItemActions({ itemId, itemType, currentStatus, statuses, onDeleted }: ItemActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStatusChange(newStatus: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/projects/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: itemType, item_id: itemId, status: newStatus }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to update')
      }
      toast.success(`Status updated to ${statuses.find(s => s.value === newStatus)?.label || newStatus}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this item? This cannot be undone.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/items?type=${itemType}&item_id=${itemId}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to delete')
      }
      toast.success('Item deleted')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {statuses.length > 1 && (
        <select
          value={currentStatus}
          onChange={e => handleStatusChange(e.target.value)}
          disabled={loading}
          className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:border-blue-400 disabled:opacity-50"
        >
          {statuses.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      )}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
        title="Delete"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  )
}
