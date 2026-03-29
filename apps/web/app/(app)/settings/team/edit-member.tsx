'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'office_manager', label: 'Office Manager' },
  { value: 'estimator', label: 'Estimator' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'foreman', label: 'Foreman' },
  { value: 'technician', label: 'Technician' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'viewer', label: 'Viewer' },
]

interface Props {
  memberId: string
  firstName: string
  lastName: string
  role: string
  phone?: string
  title?: string
  hourlyRate?: number
  isActive: boolean
}

export function EditMemberButton(props: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    role: props.role,
    phone: props.phone ?? '',
    title: props.title ?? '',
    hourly_rate: props.hourlyRate?.toString() ?? '',
    is_active: props.isActive,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/team/member', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: props.memberId,
          role: form.role,
          phone: form.phone || null,
          title: form.title || null,
          hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
          is_active: form.is_active,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success('Team member updated')
      setOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
        Edit
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Edit {props.firstName} {props.lastName}</h3>
          <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white">
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Job Title</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Lead Roofer" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="520-555-0100" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Hourly Rate ($)</label>
            <input type="number" step="0.50" min="0" value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))} placeholder="0.00" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded border-gray-300" />
            <label className="text-sm text-gray-700">Active employee</label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  )
}
