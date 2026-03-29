'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, Camera } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = [
  { value: 'materials', label: 'Materials' },
  { value: 'labor', label: 'Labor' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'permits', label: 'Permits' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'tools', label: 'Tools' },
  { value: 'dump_fees', label: 'Dump Fees' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'overhead', label: 'Overhead' },
  { value: 'other', label: 'Other' },
]

export function AddExpenseButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    category: 'materials',
    amount: '',
    tax_amount: '0',
    vendor_name: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    is_billable: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.amount) { toast.error('Title and amount required'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          title: form.title,
          category: form.category,
          amount: parseFloat(form.amount),
          tax_amount: parseFloat(form.tax_amount) || 0,
          vendor_name: form.vendor_name || undefined,
          description: form.description || undefined,
          expense_date: form.expense_date,
          is_billable: form.is_billable,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success('Expense added')
      setShowForm(false)
      setForm({ title: '', category: 'materials', amount: '', tax_amount: '0', vendor_name: '', description: '', expense_date: new Date().toISOString().split('T')[0], is_billable: false })
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (!showForm) {
    return (
      <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        <Plus className="w-4 h-4" /> Add Expense
      </button>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">New Expense</h3>
        <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Shingles from Home Depot" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Vendor</label>
            <input type="text" value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))} placeholder="e.g. Home Depot" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Amount *</label>
            <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Tax</label>
            <input type="number" step="0.01" min="0" value={form.tax_amount} onChange={e => setForm(f => ({ ...f, tax_amount: e.target.value }))} placeholder="0.00" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Date</label>
            <input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_billable} onChange={e => setForm(f => ({ ...f, is_billable: e.target.checked }))} className="rounded border-gray-300" />
              <span className="text-xs text-gray-600">Billable to customer</span>
            </label>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-gray-600">Notes</label>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Expense
          </button>
        </div>
      </form>
    </div>
  )
}
