'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogClose, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { MapPin, Plus, Star, Trash2, ExternalLink, StickyNote, Send } from 'lucide-react'
import { toast } from 'sonner'

const JobMap = dynamic(() => import('@/components/maps/job-map').then(m => m.JobMap), { ssr: false })

interface Address {
  id: string
  label: string
  address_line1: string
  address_line2: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  is_primary: boolean
  notes: string | null
  lat: number | null
  lng: number | null
}

interface Note {
  id: string
  body: string
  created_at: string
  author: { first_name: string | null; last_name: string | null } | null
}

interface Props {
  customerId: string
  customerName: string
  initialAddresses: Address[]
  baseLocation?: { lat: number; lng: number; name: string } | null
}

function formatAddr(a: Address) {
  return [a.address_line1, a.city, a.state, a.zip].filter(Boolean).join(', ')
}

export function CustomerAddressesPanel({ customerId, customerName, initialAddresses, baseLocation }: Props) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notesByAddress, setNotesByAddress] = useState<Record<string, Note[]>>({})
  const [newNote, setNewNote] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    label: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    is_primary: false,
    notes: '',
  })

  async function reload() {
    const res = await fetch(`/api/customers/${customerId}/addresses`)
    const json = await res.json()
    setAddresses(json.data || [])
  }

  async function loadNotes(addressId: string) {
    const res = await fetch(`/api/customers/${customerId}/addresses/${addressId}/notes`)
    const json = await res.json()
    setNotesByAddress(prev => ({ ...prev, [addressId]: json.data || [] }))
  }

  function toggleExpand(addressId: string) {
    if (expandedId === addressId) {
      setExpandedId(null)
      return
    }
    setExpandedId(addressId)
    if (!notesByAddress[addressId]) loadNotes(addressId)
  }

  async function handleAdd() {
    if (!form.label.trim() || !form.address_line1.trim()) {
      toast.error('Label and street address are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${customerId}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: form.label,
          address_line1: form.address_line1,
          address_line2: form.address_line2 || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          zip: form.zip || undefined,
          is_primary: form.is_primary,
          notes: form.notes || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Failed to add address')
        return
      }
      toast.success('Address added')
      setShowAdd(false)
      setForm({ label: '', address_line1: '', address_line2: '', city: '', state: '', zip: '', is_primary: false, notes: '' })
      reload()
    } finally {
      setSaving(false)
    }
  }

  async function handleSetPrimary(a: Address) {
    if (a.is_primary) return
    const res = await fetch(`/api/customers/${customerId}/addresses/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ set_primary: true }),
    })
    if (!res.ok) {
      toast.error('Failed to set primary')
      return
    }
    toast.success(`${a.label} set as primary / billing`)
    reload()
  }

  async function handleDelete(a: Address) {
    if (!confirm(`Remove address "${a.label}"?`)) return
    const res = await fetch(`/api/customers/${customerId}/addresses/${a.id}`, { method: 'DELETE' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(json.error || 'Failed to remove')
      return
    }
    toast.success('Address removed')
    reload()
  }

  async function handleAddNote(addressId: string) {
    const text = newNote[addressId]?.trim()
    if (!text) return
    const res = await fetch(`/api/customers/${customerId}/addresses/${addressId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error || 'Failed to save note')
      return
    }
    setNotesByAddress(prev => ({ ...prev, [addressId]: [json.data, ...(prev[addressId] || [])] }))
    setNewNote(prev => ({ ...prev, [addressId]: '' }))
  }

  async function handleDeleteNote(addressId: string, noteId: string) {
    const res = await fetch(`/api/customers/${customerId}/addresses/${addressId}/notes/${noteId}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Failed to delete note')
      return
    }
    setNotesByAddress(prev => ({
      ...prev,
      [addressId]: (prev[addressId] || []).filter(n => n.id !== noteId),
    }))
  }

  const mapPoints = addresses
    .filter(a => a.lat != null && a.lng != null)
    .map(a => ({
      id: a.id,
      title: a.label,
      status: a.is_primary ? 'approved' : 'scheduled',
      lat: a.lat as number,
      lng: a.lng as number,
      address: formatAddr(a),
      customer_name: customerName,
    }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Addresses ({addresses.length})
        </h2>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Address
        </Button>
      </div>

      {(mapPoints.length > 0 || baseLocation) && (
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <JobMap jobs={mapPoints} height="260px" baseLocation={baseLocation ?? undefined} />
        </div>
      )}

      {addresses.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No addresses yet. Add one to start tracking.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {addresses.map(a => {
            const isExpanded = expandedId === a.id
            const notes = notesByAddress[a.id] || []
            return (
              <div key={a.id} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => toggleExpand(a.id)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{a.label}</span>
                      {a.is_primary && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                          <Star className="w-3 h-3" /> Primary / Billing
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{a.address_line1}{a.address_line2 ? `, ${a.address_line2}` : ''}</p>
                    <p className="text-sm text-gray-500">{[a.city, a.state, a.zip].filter(Boolean).join(', ')}</p>
                    {a.notes && <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{a.notes}</p>}
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(formatAddr(a))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Open in Google Maps"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {!a.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(a)}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                        title="Set as primary / billing"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(a)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 ml-1 pl-3 border-l-2 border-gray-100 space-y-3">
                    <div className="flex items-start gap-2">
                      <textarea
                        value={newNote[a.id] ?? ''}
                        onChange={e => setNewNote(prev => ({ ...prev, [a.id]: e.target.value }))}
                        rows={2}
                        placeholder="Add a note for this location…"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      <Button size="sm" onClick={() => handleAddNote(a.id)} disabled={!newNote[a.id]?.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    {notes.length === 0 ? (
                      <p className="text-xs text-gray-400">No notes yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {notes.map(n => (
                          <div key={n.id} className="bg-gray-50 rounded-lg p-2.5 text-sm group">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-gray-500">
                                {n.author ? `${n.author.first_name ?? ''} ${n.author.last_name ?? ''}`.trim() : 'Unknown'} · {new Date(n.created_at).toLocaleString()}
                              </span>
                              <button
                                onClick={() => handleDeleteNote(a.id, n.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 text-xs"
                                title="Delete note"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-gray-800 whitespace-pre-wrap mt-1">{n.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} className="max-w-lg">
        <DialogClose onClose={() => setShowAdd(false)} />
        <DialogHeader>
          <DialogTitle>Add Address</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <div>
            <Label required>Label</Label>
            <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="e.g. Main Office, Unit 4B, Warehouse" />
          </div>
          <div>
            <Label required>Street Address</Label>
            <Input value={form.address_line1} onChange={e => setForm({ ...form, address_line1: e.target.value })} />
          </div>
          <div>
            <Label>Line 2</Label>
            <Input value={form.address_line2} onChange={e => setForm({ ...form, address_line2: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>City</Label>
              <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>ZIP</Label>
            <Input value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} />
          </div>
          <div>
            <Label>Initial notes (optional)</Label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_primary}
              onChange={e => setForm({ ...form, is_primary: e.target.checked })}
              className="rounded border-gray-300"
            />
            Set as primary / billing address
          </label>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAdd(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleAdd} disabled={saving}>{saving ? 'Saving…' : 'Add Address'}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
