'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

const INDUSTRIES = [
  'roofing', 'general_contractor', 'electrical', 'plumbing', 'hvac',
  'landscaping', 'painting', 'flooring', 'concrete', 'masonry',
  'framing', 'insulation', 'windows_doors', 'solar', 'other',
]

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern — New York' },
  { value: 'America/Chicago', label: 'Central — Chicago' },
  { value: 'America/Denver', label: 'Mountain — Denver' },
  { value: 'America/Phoenix', label: 'Arizona — Phoenix (no DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific — Los Angeles' },
  { value: 'America/Anchorage', label: 'Alaska — Anchorage' },
  { value: 'Pacific/Honolulu', label: 'Hawaii — Honolulu (no DST)' },
  { value: 'America/Indiana/Indianapolis', label: 'Eastern — Indianapolis' },
  { value: 'America/Detroit', label: 'Eastern — Detroit' },
  { value: 'America/Boise', label: 'Mountain — Boise' },
  { value: 'America/Puerto_Rico', label: 'Atlantic — Puerto Rico' },
]

interface Props {
  org: {
    name: string
    industry: string
    phone: string
    email: string
    website: string
    timezone: string
    address_line1: string
    city: string
    state: string
    zip: string
  }
}

export function EditCompanyButton({ org }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: org.name ?? '',
    industry: org.industry ?? 'general_contractor',
    phone: org.phone ?? '',
    email: org.email ?? '',
    website: org.website ?? '',
    timezone: org.timezone ?? 'America/Denver',
    address_line1: org.address_line1 ?? '',
    city: org.city ?? '',
    state: org.state ?? '',
    zip: org.zip ?? '',
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success('Company info updated')
      setOpen(false)
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Edit</button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Edit Company Info</h3>
          <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600">Company Name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Industry</label>
            <select value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white capitalize">
              {INDUSTRIES.map(i => <option key={i} value={i}>{i.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Timezone</label>
            <select value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white">
              {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600">Website</label>
            <input type="url" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600">Street Address</label>
            <input type="text" value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">City</label>
            <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">State</label>
              <input type="text" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">ZIP</label>
              <input type="text" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  )
}
