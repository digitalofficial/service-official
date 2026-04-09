'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

interface LineItem {
  name: string
  description: string
  quantity: string
  unit: string
  unit_cost: string
}

export default function NewPurchaseOrderPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [vendors, setVendors] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [showNewVendor, setShowNewVendor] = useState(false)
  const [newVendorName, setNewVendorName] = useState('')

  const [form, setForm] = useState({
    title: '',
    vendor_id: '',
    project_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    expected_delivery: '',
    tax_rate: '0',
    shipping_cost: '0',
    payment_terms: '',
    shipping_address: '',
    notes: '',
    internal_notes: '',
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { name: '', description: '', quantity: '1', unit: 'ea', unit_cost: '0' },
  ])

  useEffect(() => {
    fetch('/api/vendors').then(r => r.json()).then(d => setVendors(d.data || []))
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(d.data || []))
  }, [])

  function addLineItem() {
    setLineItems([...lineItems, { name: '', description: '', quantity: '1', unit: 'ea', unit_cost: '0' }])
  }

  function removeLineItem(index: number) {
    if (lineItems.length <= 1) return
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string) {
    setLineItems(lineItems.map((li, i) => i === index ? { ...li, [field]: value } : li))
  }

  const subtotal = lineItems.reduce((sum, li) => sum + (parseFloat(li.quantity) || 0) * (parseFloat(li.unit_cost) || 0), 0)
  const taxAmount = subtotal * (parseFloat(form.tax_rate) || 0) / 100
  const total = subtotal + taxAmount + (parseFloat(form.shipping_cost) || 0)

  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)

  async function handleCreateVendor() {
    if (!newVendorName) return
    const res = await fetch('/api/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newVendorName }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setVendors([...vendors, data])
      setForm(f => ({ ...f, vendor_id: data.id }))
      setNewVendorName('')
      setShowNewVendor(false)
      toast.success('Vendor created')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validItems = lineItems.filter(li => li.name)
    if (validItems.length === 0) { toast.error('Add at least one line item'); return }

    setSaving(true)
    const res = await fetch('/api/purchase-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        vendor_id: form.vendor_id || undefined,
        project_id: form.project_id || undefined,
        tax_rate: parseFloat(form.tax_rate) || 0,
        shipping_cost: parseFloat(form.shipping_cost) || 0,
        line_items: validItems.map(li => ({
          name: li.name,
          description: li.description || undefined,
          quantity: parseFloat(li.quantity) || 1,
          unit: li.unit || 'ea',
          unit_cost: parseFloat(li.unit_cost) || 0,
        })),
      }),
    })

    if (res.ok) {
      const { data } = await res.json()
      toast.success(`PO ${data.po_number} created`)
      router.push(`/purchase-orders/${data.id}`)
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to create PO')
    }
    setSaving(false)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/purchase-orders" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Purchase Order</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">PO Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Title</Label>
              <Input placeholder="e.g. Roofing materials for 123 Main St" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Vendor</Label>
              {showNewVendor ? (
                <div className="flex gap-2">
                  <Input placeholder="Vendor name" value={newVendorName} onChange={e => setNewVendorName(e.target.value)} />
                  <Button type="button" onClick={handleCreateVendor} disabled={!newVendorName}>Add</Button>
                  <Button type="button" variant="outline" onClick={() => setShowNewVendor(false)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select value={form.vendor_id} onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))} options={[
                    { value: '', label: 'Select vendor...' },
                    ...vendors.map(v => ({ value: v.id, label: v.name })),
                  ]} className="flex-1" />
                  <Button type="button" variant="outline" onClick={() => setShowNewVendor(true)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label>Project</Label>
              <Select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} options={[
                { value: '', label: 'Select project...' },
                ...projects.map(p => ({ value: p.id, label: p.name })),
              ]} />
            </div>
            <div>
              <Label>Issue Date</Label>
              <Input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} />
            </div>
            <div>
              <Label>Expected Delivery</Label>
              <Input type="date" value={form.expected_delivery} onChange={e => setForm(f => ({ ...f, expected_delivery: e.target.value }))} />
            </div>
            <div>
              <Label>Payment Terms</Label>
              <Select value={form.payment_terms} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))} options={[
                { value: '', label: 'Select...' },
                { value: 'NET15', label: 'Net 15' },
                { value: 'NET30', label: 'Net 30' },
                { value: 'NET60', label: 'Net 60' },
                { value: 'COD', label: 'COD' },
                { value: 'PREPAID', label: 'Prepaid' },
              ]} />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Line Items</h2>
          <div className="space-y-3">
            {lineItems.map((li, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  {i === 0 && <Label>Item Name</Label>}
                  <Input placeholder="Item name" value={li.name} onChange={e => updateLineItem(i, 'name', e.target.value)} required />
                </div>
                <div className="col-span-2">
                  {i === 0 && <Label>Qty</Label>}
                  <Input type="number" step="0.01" value={li.quantity} onChange={e => updateLineItem(i, 'quantity', e.target.value)} />
                </div>
                <div className="col-span-1">
                  {i === 0 && <Label>Unit</Label>}
                  <Input value={li.unit} onChange={e => updateLineItem(i, 'unit', e.target.value)} placeholder="ea" />
                </div>
                <div className="col-span-2">
                  {i === 0 && <Label>Unit Cost</Label>}
                  <Input type="number" step="0.01" value={li.unit_cost} onChange={e => updateLineItem(i, 'unit_cost', e.target.value)} />
                </div>
                <div className="col-span-2 text-right">
                  {i === 0 && <Label>Total</Label>}
                  <p className="py-2 text-sm font-medium text-gray-900">
                    {fmt((parseFloat(li.quantity) || 0) * (parseFloat(li.unit_cost) || 0))}
                  </p>
                </div>
                <div className="col-span-1">
                  {i === 0 && <Label>&nbsp;</Label>}
                  <button type="button" onClick={() => removeLineItem(i)} className="p-2 text-gray-400 hover:text-red-500" disabled={lineItems.length <= 1}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={addLineItem}>
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm items-center gap-4">
              <span className="text-gray-500">Tax Rate (%)</span>
              <Input type="number" step="0.01" className="w-24 text-right" value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))} />
              <span className="font-medium w-24 text-right">{fmt(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-sm items-center gap-4">
              <span className="text-gray-500">Shipping</span>
              <Input type="number" step="0.01" className="w-24 text-right" value={form.shipping_cost} onChange={e => setForm(f => ({ ...f, shipping_cost: e.target.value }))} />
              <span className="font-medium w-24 text-right">{fmt(parseFloat(form.shipping_cost) || 0)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-2">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div>
            <Label>Notes (visible to vendor)</Label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Delivery instructions, special requirements..." />
          </div>
          <div>
            <Label>Internal Notes</Label>
            <Input value={form.internal_notes} onChange={e => setForm(f => ({ ...f, internal_notes: e.target.value }))} placeholder="Internal notes (not visible to vendor)..." />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/purchase-orders">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create Purchase Order'}
          </Button>
        </div>
      </form>
    </div>
  )
}
