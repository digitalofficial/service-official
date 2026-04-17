'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DEFAULT_LEAD_SOURCES as SOURCE_OPTIONS } from '@/lib/constants/lead-sources'
import {
  ArrowLeft, Save, Trash2, DollarSign, Calendar, User,
  Building2, Mail, Phone, Tag, Loader2,
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'unqualified', label: 'Unqualified' },
]

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-indigo-100 text-indigo-700',
  proposal: 'bg-purple-100 text-purple-700',
  negotiating: 'bg-amber-100 text-amber-700',
  won: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
  unqualified: 'bg-gray-100 text-gray-500',
}

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const id = params.id
  const router = useRouter()
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchLead() }, [id])

  async function fetchLead() {
    setLoading(true)
    const res = await fetch(`/api/leads/${id}`)
    if (!res.ok) { router.push('/leads'); return }
    const json = await res.json()
    setLead(json.data)
    setForm({
      title: json.data.title ?? '',
      description: json.data.description ?? '',
      status: json.data.status ?? 'new',
      estimated_value: json.data.estimated_value ?? '',
      source: json.data.source ?? '',
      follow_up_date: json.data.follow_up_date ?? '',
      tags: (json.data.tags ?? []).join(', '),
    })
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const body: Record<string, any> = {
        title: form.title,
        description: form.description || null,
        status: form.status,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
        source: form.source || null,
        follow_up_date: form.follow_up_date || null,
        tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      }

      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to update lead')
        return
      }

      const json = await res.json()
      setLead(json.data)
      setEditing(false)
      toast.success('Lead updated')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this lead?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('Failed to delete lead')
        return
      }
      toast.success('Lead deleted')
      router.push('/leads')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-100 rounded-lg" />
      </div>
    )
  }

  if (!lead) return null

  const statusColor = STATUS_COLORS[lead.status] ?? STATUS_COLORS.new

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/leads" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{lead.title}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                {STATUS_OPTIONS.find(s => s.value === lead.status)?.label ?? lead.status}
              </span>
            </div>
            {lead.customer && (
              <p className="text-sm text-gray-500">
                <Link href={`/customers/${lead.customer.id}`} className="hover:text-blue-600 hover:underline">
                  {lead.customer.company_name ?? `${lead.customer.first_name} ${lead.customer.last_name}`}
                </Link>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Save</>}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>Edit</Button>
              <Button variant="outline" onClick={handleDelete} disabled={deleting} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {editing ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="title" required>Title</Label>
                <Input id="title" value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <Select id="status" value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))} options={STATUS_OPTIONS} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                  <Input id="estimated_value" type="number" step="0.01" value={form.estimated_value} onChange={e => setForm((f: any) => ({ ...f, estimated_value: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="source">Source</Label>
                  <Select id="source" value={form.source} onChange={e => setForm((f: any) => ({ ...f, source: e.target.value }))} placeholder="Select source..." options={SOURCE_OPTIONS} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="follow_up_date">Follow-up Date</Label>
                  <Input id="follow_up_date" type="date" value={form.follow_up_date} onChange={e => setForm((f: any) => ({ ...f, follow_up_date: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" value={form.tags} onChange={e => setForm((f: any) => ({ ...f, tags: e.target.value }))} placeholder="residential, urgent, high-priority" />
              </div>
            </div>
          ) : (
            <>
              {/* Details Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Lead Details</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {lead.estimated_value != null && (
                    <div>
                      <p className="text-gray-500 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Estimated Value</p>
                      <p className="font-medium text-gray-900">{formatCurrency(lead.estimated_value)}</p>
                    </div>
                  )}
                  {lead.source && (
                    <div>
                      <p className="text-gray-500 flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Source</p>
                      <p className="font-medium text-gray-900 capitalize">{lead.source}</p>
                    </div>
                  )}
                  {lead.follow_up_date && (
                    <div>
                      <p className="text-gray-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Follow-up Date</p>
                      <p className="font-medium text-gray-900">{formatDate(lead.follow_up_date)}</p>
                    </div>
                  )}
                  {lead.assignee && (
                    <div>
                      <p className="text-gray-500 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Assigned To</p>
                      <p className="font-medium text-gray-900">{lead.assignee.first_name} {lead.assignee.last_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">{formatDate(lead.created_at)}</p>
                  </div>
                  {lead.updated_at && lead.updated_at !== lead.created_at && (
                    <div>
                      <p className="text-gray-500">Last Updated</p>
                      <p className="font-medium text-gray-900">{formatDate(lead.updated_at)}</p>
                    </div>
                  )}
                </div>

                {lead.tags?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1.5">Tags</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {lead.tags.map((tag: string) => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {lead.description && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.description}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          {lead.customer && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
              <h2 className="font-semibold text-gray-900">Customer</h2>
              <div className="text-sm space-y-2">
                <div className="flex items-center gap-2">
                  {lead.customer.company_name ? (
                    <><Building2 className="w-4 h-4 text-gray-400" /><span>{lead.customer.company_name}</span></>
                  ) : (
                    <><User className="w-4 h-4 text-gray-400" /><span>{lead.customer.first_name} {lead.customer.last_name}</span></>
                  )}
                </div>
                {lead.customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${lead.customer.email}`} className="text-blue-600 hover:underline">{lead.customer.email}</a>
                  </div>
                )}
                {lead.customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${lead.customer.phone}`} className="text-blue-600 hover:underline">{lead.customer.phone}</a>
                  </div>
                )}
              </div>
              <Link href={`/customers/${lead.customer.id}`} className="block text-xs text-blue-600 hover:underline mt-2">
                View customer profile
              </Link>
            </div>
          )}

          {/* Quick Status Change */}
          {!editing && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
              <h2 className="font-semibold text-gray-900">Update Status</h2>
              <Select
                value={lead.status}
                onChange={async (e) => {
                  const newStatus = e.target.value
                  const res = await fetch(`/api/leads/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                  })
                  if (res.ok) {
                    const json = await res.json()
                    setLead(json.data)
                    toast.success(`Status updated to ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}`)
                  } else {
                    toast.error('Failed to update status')
                  }
                }}
                options={STATUS_OPTIONS}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
