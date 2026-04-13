'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'
import { InlineCustomerSelect } from '@/components/forms/inline-customer-select'
import { InlineProjectSelect } from '@/components/forms/inline-project-select'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface LineItem {
  name: string
  description: string
  quantity: number
  unit: string
  unit_cost: number
  is_taxable: boolean
}

const emptyItem = (): LineItem => ({
  name: '', description: '', quantity: 1, unit: 'ea', unit_cost: 0, is_taxable: true,
})

const TYPE_OPTIONS = [
  { label: 'Standard', value: 'standard' },
  { label: 'Progress', value: 'progress' },
  { label: 'Deposit', value: 'deposit' },
  { label: 'Final', value: 'final' },
]

export default function NewInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillProjectId = searchParams.get('project_id')
  const prefillCustomerId = searchParams.get('customer_id')

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<LineItem[]>([emptyItem()])
  const [taxRate, setTaxRate] = useState(0)

  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const removeItem = (idx: number) => {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_cost, 0)
  const taxableAmount = items.filter(i => i.is_taxable).reduce((sum, i) => sum + i.quantity * i.unit_cost, 0)
  const taxAmount = taxableAmount * (taxRate / 100)
  const total = subtotal + taxAmount

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const fd = new FormData(e.currentTarget)
      const lineItems = items.filter(i => i.name.trim()).map((item, idx) => ({
        ...item,
        total: item.quantity * item.unit_cost,
        order_index: idx,
      }))

      const body: Record<string, any> = {
        title: fd.get('title') || undefined,
        customer_id: fd.get('customer_id') || undefined,
        project_id: fd.get('project_id') || undefined,
        type: fd.get('type') || 'standard',
        issue_date: fd.get('issue_date') || new Date().toISOString().split('T')[0],
        due_date: fd.get('due_date') || undefined,
        terms: fd.get('terms') || undefined,
        notes: fd.get('notes') || undefined,
        status: 'draft',
        subtotal,
        tax_amount: taxAmount,
        discount_amount: 0,
        total,
        line_items: lineItems,
      }

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to create invoice')
        return
      }

      const { data } = await res.json()
      toast.success('Invoice created')
      router.push(`/invoices/${data.id}`)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/invoices" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InlineCustomerSelect defaultValue={prefillCustomerId ?? ''} required />
            <InlineProjectSelect defaultValue={prefillProjectId ?? ''} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="type">Invoice Type</Label>
              <Select id="type" name="type" options={TYPE_OPTIONS} defaultValue="standard" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="issue_date">Issue Date</Label>
                <Input id="issue_date" name="issue_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due_date">Due Date</Label>
                <Input id="due_date" name="due_date" type="date" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title / Memo</Label>
            <Input id="title" name="title" placeholder="Progress payment #2 - framing complete" />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Line Items</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => setItems(prev => [...prev, emptyItem()])}>
              <Plus className="w-4 h-4 mr-1" />Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-3">
                {/* Mobile: stacked layout */}
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Input
                    value={item.name}
                    onChange={e => updateItem(idx, 'name', e.target.value)}
                    placeholder="Labor, materials, etc."
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Qty</Label>
                    <Input
                      type="number" step="0.01" value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                      inputMode="decimal"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Price</Label>
                    <Input
                      type="number" step="0.01" value={item.unit_cost}
                      onChange={e => updateItem(idx, 'unit_cost', Number(e.target.value))}
                      inputMode="decimal"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Total</Label>
                    <p className="h-9 flex items-center text-sm font-semibold text-gray-900">
                      {formatCurrency(item.quantity * item.unit_cost)}
                    </p>
                  </div>
                </div>
                {items.length > 1 && (
                  <button
                    type="button" onClick={() => removeItem(idx)}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4 space-y-2 sm:max-w-xs sm:ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Tax</span>
                <input
                  type="number" step="0.01" value={taxRate}
                  onChange={e => setTaxRate(Number(e.target.value))}
                  className="w-16 text-xs border border-gray-200 rounded px-2 py-1"
                  inputMode="decimal"
                /> %
              </div>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Terms & Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="terms">Payment Terms</Label>
            <Textarea id="terms" name="terms" placeholder="Net 30, 2% early payment discount..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Thank you for your business..." />
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pb-6">
          <Link href="/invoices" className="w-full sm:w-auto"><Button type="button" variant="outline" className="w-full sm:w-auto">Cancel</Button></Link>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </div>
  )
}
