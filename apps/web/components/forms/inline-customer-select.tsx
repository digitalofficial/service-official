'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  name?: string
  defaultValue?: string
  required?: boolean
  label?: string
  onChange?: (customerId: string) => void
}

export function InlineCustomerSelect({ name = 'customer_id', defaultValue = '', required, label = 'Customer', onChange }: Props) {
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState(defaultValue)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', company_name: '', email: '', phone: '' })

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => setCustomers(d.data ?? []))
  }, [])

  const createCustomer = async () => {
    if (!form.first_name && !form.company_name) { toast.error('Name or company required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'residential', ...form }),
      })
      if (!res.ok) throw new Error('Failed')
      const { data } = await res.json()
      setCustomers(prev => [...prev, data])
      setSelectedId(data.id)
      onChange?.(data.id)
      setShowNew(false)
      setForm({ first_name: '', last_name: '', company_name: '', email: '', phone: '' })
      toast.success('Customer created')
    } catch { toast.error('Failed to create customer') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">{label}{required ? ' *' : ''}</label>
        <button type="button" onClick={() => setShowNew(!showNew)} className="text-xs text-blue-600 hover:underline">
          {showNew ? 'Select existing' : '+ New customer'}
        </button>
      </div>

      {showNew ? (
        <div className="space-y-2 p-3 bg-blue-50/50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="First name" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg" />
            <input type="text" placeholder="Last name" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg" />
          </div>
          <input type="text" placeholder="Company (optional)" value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg" />
          <div className="grid grid-cols-2 gap-2">
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg" />
            <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg" />
          </div>
          <button type="button" onClick={createCustomer} disabled={saving} className="w-full px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1">
            {saving && <Loader2 className="w-3 h-3 animate-spin" />} Create & Select
          </button>
        </div>
      ) : (
        <select
          name={name} value={selectedId} onChange={e => { setSelectedId(e.target.value); onChange?.(e.target.value) }} required={required}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-400"
        >
          <option value="">Select customer...</option>
          {customers.map((c: any) => (
            <option key={c.id} value={c.id}>{c.company_name ?? `${c.first_name} ${c.last_name}`}</option>
          ))}
        </select>
      )}

      {/* Hidden input ensures the value is submitted even when in "new" mode */}
      {showNew && <input type="hidden" name={name} value={selectedId} />}
    </div>
  )
}
