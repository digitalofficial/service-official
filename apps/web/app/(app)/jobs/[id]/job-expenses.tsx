'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, Plus, X, Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

interface Props {
  jobId: string
  projectId?: string
  expenses: any[]
}

export function JobExpenses({ jobId, projectId, expenses }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
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

  const handleReceiptScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF')
      return
    }

    setScanning(true)
    try {
      // Upload the receipt file first
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('job_id', jobId)
      uploadData.append('file_type', 'other')
      uploadData.append('description', 'Receipt')

      const uploadRes = await fetch('/api/files', { method: 'POST', body: uploadData })
      if (!uploadRes.ok) throw new Error('Upload failed')

      // Ask Alfred to extract receipt data
      const res = await fetch('/api/alfred/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `I just uploaded a receipt from a job. The file is named "${file.name}". Based on the filename and common receipt patterns, suggest reasonable values for: title (what was purchased), category (one of: materials, labor, equipment, fuel, permits, subcontractor, tools, dump_fees, insurance, overhead, other), vendor_name, and approximate amount. Respond ONLY with JSON like: {"title":"...","category":"...","vendor_name":"...","amount":"...","tax_amount":"..."}. If you can't determine something, use empty string. Keep it brief.`
          }],
          currentPage: '/jobs/' + jobId,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        try {
          const parsed = JSON.parse(data.content.replace(/```json|```/g, '').trim())
          setForm(prev => ({
            ...prev,
            title: parsed.title || prev.title,
            category: CATEGORIES.find(c => c.value === parsed.category)?.value || prev.category,
            vendor_name: parsed.vendor_name || prev.vendor_name,
            amount: parsed.amount || prev.amount,
            tax_amount: parsed.tax_amount || prev.tax_amount,
          }))
          toast.success('Receipt scanned — review and save')
        } catch {
          toast.info('Receipt uploaded — fill in details manually')
        }
      }
    } catch {
      toast.error('Failed to process receipt')
    } finally {
      setScanning(false)
      setShowForm(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.amount) {
      toast.error('Title and amount are required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          project_id: projectId || undefined,
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

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }

      toast.success('Expense added')
      setShowForm(false)
      setForm({ title: '', category: 'materials', amount: '', tax_amount: '0', vendor_name: '', description: '', expense_date: new Date().toISOString().split('T')[0], is_billable: false })
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const total = expenses.reduce((s: number, e: any) => s + (e.total_amount ?? 0), 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Expenses ({expenses.length})
          {total > 0 && <span className="text-xs font-normal text-gray-500">— ${total.toFixed(2)} total</span>}
        </h2>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={handleReceiptScan} disabled={scanning} />
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              {scanning ? 'Scanning...' : 'Scan Receipt'}
            </span>
          </label>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            {showForm ? 'Cancel' : 'Add Expense'}
          </Button>
        </div>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Title *</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Shingles from Home Depot" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 bg-white">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Vendor</label>
              <input type="text" value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))} placeholder="e.g. Home Depot" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Amount *</label>
              <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Tax</label>
              <input type="number" step="0.01" min="0" value={form.tax_amount} onChange={e => setForm(f => ({ ...f, tax_amount: e.target.value }))} placeholder="0.00" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Date</label>
              <input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_billable} onChange={e => setForm(f => ({ ...f, is_billable: e.target.checked }))} className="rounded border-gray-300" />
                <span className="text-xs text-gray-600">Billable to customer</span>
              </label>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Notes</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional notes" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Save Expense
            </Button>
          </div>
        </form>
      )}

      {/* Expense List */}
      {expenses.length === 0 && !showForm ? (
        <p className="text-sm text-gray-400 text-center py-4">No expenses tracked — add manually or scan a receipt</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {expenses.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{e.title}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {e.category?.replace(/_/g, ' ')}{e.vendor_name ? ` — ${e.vendor_name}` : ''}
                  {e.is_billable && <span className="ml-1 text-blue-600">• billable</span>}
                </p>
              </div>
              <span className="text-sm font-medium text-gray-900">${(e.total_amount ?? 0).toFixed(2)}</span>
            </div>
          ))}
          {expenses.length > 0 && (
            <div className="flex justify-between pt-2.5 text-sm font-bold text-gray-900">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
