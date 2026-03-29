'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function AddMemberButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [team, setTeam] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [role, setRole] = useState('')
  const [rate, setRate] = useState('')

  useEffect(() => {
    if (open && team.length === 0) {
      fetch('/api/team').then(r => r.json()).then(d => setTeam(d.data ?? []))
    }
  }, [open])

  const handleAdd = async () => {
    if (!selectedId) { toast.error('Select a team member'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/projects/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          user_id: selectedId,
          role: role || undefined,
          hourly_rate: rate ? parseFloat(rate) : undefined,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success('Team member added')
      setOpen(false)
      setSelectedId('')
      setRole('')
      setRate('')
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        <Plus className="w-4 h-4" /> Add Member
      </button>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Add Team Member</h3>
        <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Employee</label>
          <select value={selectedId} onChange={e => {
            setSelectedId(e.target.value)
            const member = team.find(t => t.id === e.target.value)
            if (member?.hourly_rate) setRate(member.hourly_rate.toString())
            if (member?.role) setRole(member.role.replace(/_/g, ' '))
          }} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white">
            <option value="">Select team member...</option>
            {team.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name} — {m.role?.replace(/_/g, ' ')}{m.hourly_rate ? ` ($${m.hourly_rate}/hr)` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Project Role</label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Lead Roofer" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Hourly Rate ($)</label>
            <input type="number" step="0.50" min="0" value={rate} onChange={e => setRate(e.target.value)} placeholder="From profile" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleAdd} disabled={saving || !selectedId} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add to Project
          </button>
        </div>
      </div>
    </div>
  )
}
