'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const TYPE_OPTIONS = [
  { label: 'Residential', value: 'residential' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'Property Manager', value: 'property_manager' },
  { label: 'HOA', value: 'hoa' },
  { label: 'Government', value: 'government' },
]

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    type: 'residential',
    first_name: '',
    last_name: '',
    company_name: '',
    email: '',
    phone: '',
    address_line1: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
  })

  useEffect(() => {
    fetch(`/api/customers/${params.id}`)
      .then(r => r.json())
      .then(({ data }) => {
        if (data) setForm({
          type: data.type ?? 'residential',
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          company_name: data.company_name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          address_line1: data.address_line1 ?? '',
          city: data.city ?? '',
          state: data.state ?? '',
          zip: data.zip ?? '',
          notes: data.notes ?? '',
        })
        setLoading(false)
      })
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success('Customer updated')
      router.push(`/customers/${params.id}`)
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/customers/${params.id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit Customer</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <label className="text-xs font-medium text-gray-600">Customer Type</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white">
            {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600">First Name</label>
            <input type="text" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Last Name</label>
            <input type="text" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">Company Name</label>
          <input type="text" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label className="text-xs font-medium text-gray-600">Street Address</label>
          <input type="text" value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600">City</label>
            <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">State</label>
            <input type="text" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">ZIP</label>
            <input type="text" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none" />
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Link href={`/customers/${params.id}`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
