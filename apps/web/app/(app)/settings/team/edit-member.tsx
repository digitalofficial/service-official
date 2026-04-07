'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X, Bell } from 'lucide-react'
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

const REMINDER_OPTIONS = [
  { value: '1 day', label: '1 day before' },
  { value: 'morning', label: 'Morning of (8 AM)' },
  { value: '2 hours', label: '2 hours before' },
  { value: '1 hour', label: '1 hour before' },
  { value: '30 minutes', label: '30 minutes before' },
  { value: '15 minutes', label: '15 minutes before' },
  { value: '0', label: 'None' },
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
  reminderPref1?: string
  reminderPref2?: string
  notifySms?: boolean
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
    reminder_pref_1: props.reminderPref1 ?? '1 day',
    reminder_pref_2: props.reminderPref2 ?? '1 hour',
    notify_sms: props.notifySms ?? true,
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
          reminder_pref_1: form.reminder_pref_1,
          reminder_pref_2: form.reminder_pref_2,
          notify_sms: form.notify_sms,
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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

        {/* SMS & Reminder Settings */}
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-gray-700">Notifications</h4>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">SMS notifications</label>
            <button
              onClick={() => setForm(f => ({ ...f, notify_sms: !f.notify_sms }))}
              className={`relative rounded-full transition-colors ${form.notify_sms ? 'bg-blue-600' : 'bg-gray-200'}`}
              style={{ width: 44, height: 24 }}
            >
              <span
                className="absolute top-[3px] rounded-full bg-white shadow transition-transform"
                style={{ width: 18, height: 18, left: form.notify_sms ? 23 : 3 }}
              />
            </button>
          </div>

          {form.notify_sms && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">First Reminder</label>
                <select
                  value={form.reminder_pref_1}
                  onChange={e => setForm(f => ({ ...f, reminder_pref_1: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                >
                  {REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Second Reminder</label>
                <select
                  value={form.reminder_pref_2}
                  onChange={e => setForm(f => ({ ...f, reminder_pref_2: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                >
                  {REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          )}
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
