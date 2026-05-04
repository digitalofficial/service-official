'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Loader2, Plus, Trash2, Camera, X } from 'lucide-react'
import { InlineCustomerSelect } from '@/components/forms/inline-customer-select'
import { InlineProjectSelect } from '@/components/forms/inline-project-select'
import { TermsTemplateSelect } from '@/components/forms/terms-template-select'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

const LINE_ITEM_CATEGORIES = ['Materials', 'Labor', 'Parts'] as const
type LineItemCategory = typeof LINE_ITEM_CATEGORIES[number]

interface LineItem {
  name: string
  description: string
  category: LineItemCategory
  quantity: number
  unit: string
  unit_cost: number
  markup_percent: number
  is_optional: boolean
  is_taxable: boolean
}

interface ExpenseItem {
  name: string
  category: string
  amount: number
  notes: string
}

const emptyItem = (): LineItem => ({
  name: '', description: '', category: 'Materials', quantity: 1, unit: 'ea',
  unit_cost: 0, markup_percent: 0, is_optional: false, is_taxable: true,
})

const emptyExpense = (): ExpenseItem => ({
  name: '', category: '', amount: 0, notes: '',
})

export default function NewEstimatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillProjectId = searchParams.get('project_id')
  const prefillCustomerId = searchParams.get('customer_id')
  const prefillJobId = searchParams.get('job_id')

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<LineItem[]>([emptyItem()])
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [taxRate, setTaxRate] = useState(0)
  const [discountValue, setDiscountValue] = useState(0)
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [terms, setTerms] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const removeItem = (idx: number) => {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const updateExpense = (idx: number, field: keyof ExpenseItem, value: any) => {
    setExpenses(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const removeExpense = (idx: number) => {
    setExpenses(prev => prev.filter((_, i) => i !== idx))
  }

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    setPhotos(prev => [...prev, ...newFiles])
    setPhotoPreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))])
    if (fileRef.current) fileRef.current.value = ''
  }

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(photoPreviews[idx])
    setPhotos(prev => prev.filter((_, i) => i !== idx))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  const subtotal = items
    .filter(i => !i.is_optional)
    .reduce((sum, i) => sum + i.quantity * i.unit_cost * (1 + i.markup_percent / 100), 0)

  const discountAmount = discountType === 'percent' ? subtotal * (discountValue / 100) : discountValue
  const taxAmount = (subtotal - discountAmount) * (taxRate / 100)
  const total = subtotal - discountAmount + taxAmount

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const fd = new FormData(e.currentTarget)
      const body: Record<string, any> = {
        title: fd.get('title'),
        description: fd.get('description') || undefined,
        customer_id: fd.get('customer_id') || undefined,
        project_id: fd.get('project_id') || undefined,
        job_id: fd.get('job_id') || undefined,
        issue_date: fd.get('issue_date') || undefined,
        expiry_date: fd.get('expiry_date') || undefined,
        terms: fd.get('terms') || undefined,
        notes: fd.get('notes') || undefined,
        tax_rate: taxRate,
        discount_type: discountType,
        discount_value: discountValue,
        line_items: items.filter(i => i.name.trim()).map((item, idx) => ({
          ...item,
          order_index: idx,
        })),
        expenses: expenses.filter(e => e.name.trim()).map(e => ({
          ...e,
        })),
      }

      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to create estimate')
        return
      }

      const { data } = await res.json()

      // Upload photos if any
      if (photos.length > 0) {
        for (const file of photos) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('estimate_id', data.id)
          await fetch('/api/photos/upload', { method: 'POST', body: formData }).catch(() => {})
        }
      }

      toast.success('Estimate created')
      router.push(`/estimates/${data.id}`)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/estimates" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Estimate / Quote</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" required>Estimate Title</Label>
            <Input id="title" name="title" placeholder="Roof replacement - full tear-off and install" required autoFocus />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InlineCustomerSelect defaultValue={prefillCustomerId ?? ''} />
            <InlineProjectSelect defaultValue={prefillProjectId ?? ''} />
          </div>
          <input type="hidden" name="job_id" value={prefillJobId ?? ''} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="issue_date">Issue Date</Label>
              <Input id="issue_date" name="issue_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input id="expiry_date" name="expiry_date" type="date" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Scope of work..." />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Line Items</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => setItems(prev => [...prev, emptyItem()])}>
              <Plus className="w-4 h-4 mr-1" />Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 grid grid-cols-8 gap-3">
                    <div className="col-span-3 space-y-1">
                      <Label>Item Name</Label>
                      <Input
                        value={item.name}
                        onChange={e => updateItem(idx, 'name', e.target.value)}
                        placeholder="Architectural shingles"
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <Label>Category</Label>
                      <select
                        value={item.category}
                        onChange={e => updateItem(idx, 'category', e.target.value)}
                        className="w-full h-9 text-sm border border-gray-300 rounded-md px-2"
                      >
                        {LINE_ITEM_CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>Qty</Label>
                      <Input
                        type="number" step="0.01" value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Unit Cost</Label>
                      <Input
                        type="number" step="0.01" value={item.unit_cost}
                        onChange={e => updateItem(idx, 'unit_cost', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label>Total</Label>
                      <p className="h-9 flex items-center text-sm font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unit_cost * (1 + item.markup_percent / 100))}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="mt-6 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 text-gray-600">
                    <input
                      type="checkbox" checked={item.is_taxable}
                      onChange={e => updateItem(idx, 'is_taxable', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600"
                    /> Taxable
                  </label>
                  <label className="flex items-center gap-1.5 text-gray-600">
                    <input
                      type="checkbox" checked={item.is_optional}
                      onChange={e => updateItem(idx, 'is_optional', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600"
                    /> Optional
                  </label>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    Markup %
                    <input
                      type="number" step="0.1" value={item.markup_percent}
                      onChange={e => updateItem(idx, 'markup_percent', Number(e.target.value))}
                      className="w-16 text-xs border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Discount</span>
                <select
                  value={discountType}
                  onChange={e => setDiscountType(e.target.value as 'percent' | 'fixed')}
                  className="text-xs border border-gray-200 rounded px-1.5 py-0.5"
                >
                  <option value="percent">%</option>
                  <option value="fixed">$</option>
                </select>
                <input
                  type="number" step="0.01" value={discountValue}
                  onChange={e => setDiscountValue(Number(e.target.value))}
                  className="w-20 text-xs border border-gray-200 rounded px-2 py-1"
                />
              </div>
              <span className="text-red-600">-{formatCurrency(discountAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Tax Rate</span>
                <input
                  type="number" step="0.01" value={taxRate}
                  onChange={e => setTaxRate(Number(e.target.value))}
                  className="w-20 text-xs border border-gray-200 rounded px-2 py-1"
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

        {/* Photos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Camera className="w-4 h-4" /> Photos
            </h2>
            <div>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Plus className="w-4 h-4 mr-1" />Add Photos
              </Button>
            </div>
          </div>
          {photoPreviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Add reference photos of the property or job site</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {photoPreviews.map((src, idx) => (
                <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Internal Expenses — not visible to customer */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Internal Expenses</h2>
              <p className="text-xs text-gray-400 mt-0.5">For internal tracking only — not visible to customer</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setExpenses(prev => [...prev, emptyExpense()])}>
              <Plus className="w-4 h-4 mr-1" />Add Expense
            </Button>
          </div>

          {expenses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No internal expenses added</p>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                  <div className="flex-1 grid grid-cols-4 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label>Expense Name</Label>
                      <Input
                        value={expense.name}
                        onChange={e => updateExpense(idx, 'name', e.target.value)}
                        placeholder="Dumpster rental, permits, etc."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Category</Label>
                      <Input
                        value={expense.category}
                        onChange={e => updateExpense(idx, 'category', e.target.value)}
                        placeholder="Overhead, Travel..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Amount</Label>
                      <Input
                        type="number" step="0.01" value={expense.amount}
                        onChange={e => updateExpense(idx, 'amount', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExpense(idx)}
                    className="mt-6 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-500">Total Internal Expenses</span>
                <span className="font-medium text-gray-900">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Terms & Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="terms">Terms & Conditions</Label>
              <TermsTemplateSelect type="estimate" value={terms} onChange={setTerms} />
            </div>
            <Textarea id="terms" name="terms" value={terms} onChange={e => setTerms(e.target.value)} placeholder="Payment terms, warranty info..." className="min-h-[100px]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Notes (not visible to customer)..." className="min-h-[100px]" />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/estimates"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Estimate'}
          </Button>
        </div>
      </form>
    </div>
  )
}
