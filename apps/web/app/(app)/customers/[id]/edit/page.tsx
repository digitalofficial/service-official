'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Plus, Trash2, Star, MapPin } from 'lucide-react'
import { toast } from 'sonner'

const TYPE_OPTIONS = [
  { label: 'Residential', value: 'residential' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'Property Manager', value: 'property_manager' },
  { label: 'HOA', value: 'hoa' },
  { label: 'Government', value: 'government' },
]

const MULTI_ADDRESS_TYPES = ['commercial', 'property_manager', 'hoa']

interface AddressEntry {
  id?: string
  label: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  zip: string
  is_primary: boolean
  notes: string
  _isNew?: boolean
}

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
    sms_opt_in: false,
    address_line1: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
  })
  const [addresses, setAddresses] = useState<AddressEntry[]>([])
  const [deletedAddressIds, setDeletedAddressIds] = useState<string[]>([])

  const isMultiAddress = MULTI_ADDRESS_TYPES.includes(form.type)

  useEffect(() => {
    Promise.all([
      fetch(`/api/customers/${params.id}`).then(r => r.json()),
      fetch(`/api/customers/${params.id}/addresses`).then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([customerRes, addressRes]) => {
      const data = customerRes.data
      if (data) setForm({
        type: data.type ?? 'residential',
        first_name: data.first_name ?? '',
        last_name: data.last_name ?? '',
        company_name: data.company_name ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        sms_opt_in: data.sms_opt_in ?? false,
        address_line1: data.address_line1 ?? '',
        city: data.city ?? '',
        state: data.state ?? '',
        zip: data.zip ?? '',
        notes: data.notes ?? '',
      })
      if (addressRes.data?.length) {
        setAddresses(addressRes.data.map((a: any) => ({
          id: a.id,
          label: a.label ?? 'Main',
          address_line1: a.address_line1 ?? '',
          address_line2: a.address_line2 ?? '',
          city: a.city ?? '',
          state: a.state ?? '',
          zip: a.zip ?? '',
          is_primary: a.is_primary ?? false,
          notes: a.notes ?? '',
        })))
      }
      setLoading(false)
    })
  }, [params.id])

  const addAddress = () => {
    setAddresses(prev => [...prev, {
      label: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      zip: '',
      is_primary: prev.length === 0,
      notes: '',
      _isNew: true,
    }])
  }

  const updateAddress = (index: number, field: string, value: any) => {
    setAddresses(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))
  }

  const setPrimaryAddress = (index: number) => {
    setAddresses(prev => prev.map((a, i) => ({ ...a, is_primary: i === index })))
  }

  const removeAddress = (index: number) => {
    const addr = addresses[index]
    if (addr.is_primary && addresses.length > 1) {
      toast.error('Set another address as primary first')
      return
    }
    if (addr.id) {
      setDeletedAddressIds(prev => [...prev, addr.id!])
    }
    setAddresses(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Save customer base info
      const res = await fetch(`/api/customers/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }

      // Handle multi-address saves
      if (isMultiAddress) {
        // Delete removed addresses
        for (const id of deletedAddressIds) {
          await fetch(`/api/customers/${params.id}/addresses/${id}`, { method: 'DELETE' })
        }

        // Create or update addresses
        for (const addr of addresses) {
          if (!addr.address_line1) continue
          if (addr._isNew || !addr.id) {
            await fetch(`/api/customers/${params.id}/addresses`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                label: addr.label || 'Address',
                address_line1: addr.address_line1,
                address_line2: addr.address_line2 || undefined,
                city: addr.city || undefined,
                state: addr.state || undefined,
                zip: addr.zip || undefined,
                is_primary: addr.is_primary,
                notes: addr.notes || undefined,
              }),
            })
          } else {
            await fetch(`/api/customers/${params.id}/addresses/${addr.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                label: addr.label || 'Address',
                address_line1: addr.address_line1,
                address_line2: addr.address_line2 || undefined,
                city: addr.city || undefined,
                state: addr.state || undefined,
                zip: addr.zip || undefined,
                set_primary: addr.is_primary,
                notes: addr.notes || undefined,
              }),
            })
          }
        }
      }

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

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.sms_opt_in}
            onChange={e => setForm(f => ({ ...f, sms_opt_in: e.target.checked }))}
            className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-500 leading-relaxed">
            Customer agrees to receive text messages including appointment reminders, job updates, and invoices. Message & data rates may apply. Reply STOP to opt out.
          </span>
        </label>

        {/* Single address for residential/government */}
        {!isMultiAddress && (
          <>
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
          </>
        )}

        {/* Multiple addresses for commercial/HOA/property_manager */}
        {isMultiAddress && (
          <div className="pt-2 border-t border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Addresses
              </h3>
              <button
                type="button"
                onClick={addAddress}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Address
              </button>
            </div>

            {addresses.length === 0 && (
              <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No addresses yet</p>
                <button type="button" onClick={addAddress} className="text-xs text-blue-600 hover:underline mt-1">
                  Add first address
                </button>
              </div>
            )}

            {addresses.map((addr, i) => (
              <div key={addr.id ?? `new-${i}`} className={`border rounded-lg p-4 space-y-3 ${addr.is_primary ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={addr.label}
                      onChange={e => updateAddress(i, 'label', e.target.value)}
                      placeholder="Label (e.g. Main Office, Warehouse)"
                      className="px-2 py-1 text-sm font-medium border border-gray-200 rounded bg-white w-56"
                    />
                    {addr.is_primary && (
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Primary</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!addr.is_primary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryAddress(i)}
                        title="Set as primary"
                        className="p-1.5 text-gray-400 hover:text-amber-500 rounded transition-colors"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAddress(i)}
                      title="Remove address"
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={addr.address_line1}
                    onChange={e => updateAddress(i, 'address_line1', e.target.value)}
                    placeholder="Street Address"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={addr.address_line2}
                    onChange={e => updateAddress(i, 'address_line2', e.target.value)}
                    placeholder="Apt, Suite, Unit (optional)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={addr.city}
                    onChange={e => updateAddress(i, 'city', e.target.value)}
                    placeholder="City"
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={addr.state}
                    onChange={e => updateAddress(i, 'state', e.target.value)}
                    placeholder="State"
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={addr.zip}
                    onChange={e => updateAddress(i, 'zip', e.target.value)}
                    placeholder="ZIP"
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
                <input
                  type="text"
                  value={addr.notes}
                  onChange={e => updateAddress(i, 'notes', e.target.value)}
                  placeholder="Notes (e.g. gate code, parking instructions)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-500"
                />
              </div>
            ))}
          </div>
        )}

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
