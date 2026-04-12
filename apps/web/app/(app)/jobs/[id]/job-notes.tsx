'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Save, X, StickyNote } from 'lucide-react'
import { toast } from 'sonner'

export function JobNotes({ jobId, notes }: { jobId: string; notes: string | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(notes || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: value || null }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Notes saved')
      setEditing(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <StickyNote className="w-4 h-4" /> Notes
        </h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => { setEditing(false); setValue(notes || '') }} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <X className="w-3 h-3" /> Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50">
              <Save className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Add internal notes about this job..."
          className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
          {notes || 'No notes yet — click Edit to add.'}
        </p>
      )}
    </div>
  )
}
