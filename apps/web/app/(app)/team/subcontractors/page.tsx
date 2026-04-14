'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogClose, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import {
  Plus, Search, Phone, Mail, Shield, ShieldAlert, ShieldX,
  ChevronDown, ChevronUp, Building2, FileText, CreditCard, StickyNote, Pencil, Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { SubcontractorFiles } from '@/components/subcontractors/subcontractor-files'

interface Subcontractor {
  id: string
  company_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  trade: string | null
  trades: string[] | null
  license_number: string | null
  license_expiry: string | null
  insurance_expiry: string | null
  rating: number | null
  notes: string | null
  is_active: boolean
  ein: string | null
  coi_file_url: string | null
  general_liability_policy: string | null
  general_liability_expiry: string | null
  workers_comp_policy: string | null
  workers_comp_expiry: string | null
  auto_insurance_policy: string | null
  auto_insurance_expiry: string | null
  payment_method: string | null
  payment_rate: number | null
  payment_rate_type: string | null
  w9_on_file: boolean
  insurance_status: 'valid' | 'expiring_soon' | 'expired'
}

const EMPTY_FORM: Partial<Subcontractor> = {
  company_name: '',
  contact_name: '',
  email: '',
  phone: '',
  trade: '',
  trades: [],
  license_number: '',
  license_expiry: '',
  insurance_expiry: '',
  notes: '',
  is_active: true,
  ein: '',
  coi_file_url: '',
  general_liability_policy: '',
  general_liability_expiry: '',
  workers_comp_policy: '',
  workers_comp_expiry: '',
  auto_insurance_policy: '',
  auto_insurance_expiry: '',
  payment_method: '',
  payment_rate: null,
  payment_rate_type: '',
  w9_on_file: false,
}

const TRADE_OPTIONS = [
  'Electrical', 'Plumbing', 'HVAC', 'Roofing', 'Painting', 'Drywall',
  'Concrete', 'Framing', 'Flooring', 'Landscaping', 'Excavation',
  'Demolition', 'Insulation', 'Fire Protection', 'Masonry', 'Welding',
  'Glazing', 'Fencing', 'Paving', 'General Labor', 'Other',
]

const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'check', label: 'Check' },
  { value: 'direct_deposit', label: 'Direct Deposit' },
  { value: 'ach', label: 'ACH' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'other', label: 'Other' },
]

const PAYMENT_RATE_TYPE_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'per_job', label: 'Per Job' },
  { value: 'percentage', label: 'Percentage' },
]

function InsuranceBadge({ status }: { status: string }) {
  if (status === 'expired') {
    return (
      <Badge variant="destructive" className="gap-1">
        <ShieldX className="w-3 h-3" /> Expired
      </Badge>
    )
  }
  if (status === 'expiring_soon') {
    return (
      <Badge variant="warning" className="gap-1">
        <ShieldAlert className="w-3 h-3" /> Expiring Soon
      </Badge>
    )
  }
  return (
    <Badge variant="success" className="gap-1">
      <Shield className="w-3 h-3" /> Valid
    </Badge>
  )
}

function formatDate(val: string | null) {
  if (!val) return '--'
  return new Date(val + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SubcontractorsPage() {
  const [subs, setSubs] = useState<Subcontractor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingSub, setEditingSub] = useState<Subcontractor | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Subcontractor>>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [tradesInput, setTradesInput] = useState('')

  useEffect(() => {
    fetchSubs()
  }, [showInactive])

  async function fetchSubs() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (showInactive) params.set('active', 'false')
      const res = await fetch(`/api/subcontractors?${params}`)
      const json = await res.json()
      setSubs(json.data || [])
    } catch {
      toast.error('Failed to load subcontractors')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingSub(null)
    setForm(EMPTY_FORM)
    setTradesInput('')
    setShowModal(true)
  }

  function openEdit(sub: Subcontractor) {
    setEditingSub(sub)
    setForm({
      company_name: sub.company_name || '',
      contact_name: sub.contact_name || '',
      email: sub.email || '',
      phone: sub.phone || '',
      trade: sub.trade || '',
      trades: sub.trades || [],
      license_number: sub.license_number || '',
      license_expiry: sub.license_expiry || '',
      insurance_expiry: sub.insurance_expiry || '',
      notes: sub.notes || '',
      is_active: sub.is_active ?? true,
      ein: sub.ein || '',
      coi_file_url: sub.coi_file_url || '',
      general_liability_policy: sub.general_liability_policy || '',
      general_liability_expiry: sub.general_liability_expiry || '',
      workers_comp_policy: sub.workers_comp_policy || '',
      workers_comp_expiry: sub.workers_comp_expiry || '',
      auto_insurance_policy: sub.auto_insurance_policy || '',
      auto_insurance_expiry: sub.auto_insurance_expiry || '',
      payment_method: sub.payment_method || '',
      payment_rate: sub.payment_rate,
      payment_rate_type: sub.payment_rate_type || '',
      w9_on_file: sub.w9_on_file ?? false,
    })
    setTradesInput((sub.trades || []).join(', '))
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.company_name?.trim()) {
      toast.error('Company name is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        trades: tradesInput ? tradesInput.split(',').map(t => t.trim()).filter(Boolean) : [],
        payment_rate: form.payment_rate ? Number(form.payment_rate) : null,
        // Clean empty strings to null for optional fields
        email: form.email || null,
        phone: form.phone || null,
        contact_name: form.contact_name || null,
        trade: form.trade || null,
        license_number: form.license_number || null,
        license_expiry: form.license_expiry || null,
        insurance_expiry: form.insurance_expiry || null,
        notes: form.notes || null,
        ein: form.ein || null,
        coi_file_url: form.coi_file_url || null,
        general_liability_policy: form.general_liability_policy || null,
        general_liability_expiry: form.general_liability_expiry || null,
        workers_comp_policy: form.workers_comp_policy || null,
        workers_comp_expiry: form.workers_comp_expiry || null,
        auto_insurance_policy: form.auto_insurance_policy || null,
        auto_insurance_expiry: form.auto_insurance_expiry || null,
        payment_method: form.payment_method || null,
        payment_rate_type: form.payment_rate_type || null,
      }

      const url = editingSub ? `/api/subcontractors/${editingSub.id}` : '/api/subcontractors'
      const method = editingSub ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error || 'Failed to save')
        return
      }

      toast.success(editingSub ? 'Subcontractor updated' : 'Subcontractor added — upload documents below')
      setShowModal(false)
      await fetchSubs()
      // Auto-expand the new/just-edited sub so the user sees the document upload area
      if (json?.data?.id) setExpandedId(json.data.id)
    } catch {
      toast.error('Failed to save subcontractor')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(sub: Subcontractor) {
    if (!confirm(`Deactivate ${sub.company_name}? They can be reactivated later.`)) return

    try {
      const res = await fetch(`/api/subcontractors/${sub.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        toast.error(json.error || 'Failed to deactivate')
        return
      }
      toast.success('Subcontractor deactivated')
      fetchSubs()
    } catch {
      toast.error('Failed to deactivate subcontractor')
    }
  }

  const filtered = subs.filter(s =>
    !search ||
    s.company_name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.trade?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: subs.length,
    active: subs.filter(s => s.is_active).length,
    expired: subs.filter(s => s.insurance_status === 'expired').length,
    expiringSoon: subs.filter(s => s.insurance_status === 'expiring_soon').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subcontractors"
        count={stats.total}
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Subcontractor
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Expiring Soon</p>
          <p className="text-2xl font-bold text-amber-600">{stats.expiringSoon}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Expired</p>
          <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search subcontractors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
            className="rounded border-gray-300"
          />
          Show inactive
        </label>
      </div>

      {/* Subcontractor List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {search ? 'No subcontractors match your search' : 'No subcontractors yet. Add one to get started.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(sub => {
            const isExpanded = expandedId === sub.id
            return (
              <div key={sub.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Row Header */}
                <div
                  className="p-4 sm:p-5 flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                >
                  <div className="w-11 h-11 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 text-sm font-bold shrink-0">
                    {sub.company_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900">{sub.company_name}</h3>
                      <InsuranceBadge status={sub.insurance_status} />
                      {!sub.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {sub.contact_name && (
                      <p className="text-sm text-gray-600 mt-0.5">{sub.contact_name}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
                      {sub.trade && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                          {sub.trade}
                        </span>
                      )}
                      {sub.phone && (
                        <a href={`tel:${sub.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                          <Phone className="w-3.5 h-3.5" /> {sub.phone}
                        </a>
                      )}
                      {sub.email && (
                        <a href={`mailto:${sub.email}`} className="flex items-center gap-1 hover:text-blue-600">
                          <Mail className="w-3.5 h-3.5" /> {sub.email}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(sub) }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {sub.is_active && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(sub) }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deactivate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                      {/* Licensing */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Licensing</p>
                        <div className="space-y-1 text-gray-700">
                          <p><span className="text-gray-500">License #:</span> {sub.license_number || '--'}</p>
                          <p><span className="text-gray-500">License Expiry:</span> {formatDate(sub.license_expiry)}</p>
                          <p><span className="text-gray-500">EIN:</span> {sub.ein || '--'}</p>
                        </div>
                      </div>

                      {/* Insurance */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Insurance / COI</p>
                        <div className="space-y-1 text-gray-700">
                          <p><span className="text-gray-500">GL Policy:</span> {sub.general_liability_policy || '--'}</p>
                          <p><span className="text-gray-500">GL Expiry:</span> {formatDate(sub.general_liability_expiry)}</p>
                          <p><span className="text-gray-500">Workers Comp:</span> {sub.workers_comp_policy || '--'}</p>
                          <p><span className="text-gray-500">WC Expiry:</span> {formatDate(sub.workers_comp_expiry)}</p>
                          <p><span className="text-gray-500">Auto Policy:</span> {sub.auto_insurance_policy || '--'}</p>
                          <p><span className="text-gray-500">Auto Expiry:</span> {formatDate(sub.auto_insurance_expiry)}</p>
                          {sub.coi_file_url && (
                            <a href={sub.coi_file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" /> View COI
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Payment */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment</p>
                        <div className="space-y-1 text-gray-700">
                          <p><span className="text-gray-500">Method:</span> {sub.payment_method?.replace('_', ' ') || '--'}</p>
                          <p><span className="text-gray-500">Rate:</span> {sub.payment_rate != null ? `$${sub.payment_rate}` : '--'} {sub.payment_rate_type ? `(${sub.payment_rate_type.replace('_', ' ')})` : ''}</p>
                          <p><span className="text-gray-500">W-9 on File:</span> {sub.w9_on_file ? 'Yes' : 'No'}</p>
                        </div>
                      </div>

                      {/* Trades */}
                      {sub.trades && sub.trades.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Trades</p>
                          <div className="flex flex-wrap gap-1">
                            {sub.trades.map(t => (
                              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {sub.notes && (
                        <div className="sm:col-span-2 lg:col-span-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</p>
                          <p className="text-gray-700 whitespace-pre-wrap">{sub.notes}</p>
                        </div>
                      )}

                      {/* Documents */}
                      <div className="sm:col-span-2 lg:col-span-3">
                        <SubcontractorFiles subcontractorId={sub.id} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} className="max-w-2xl">
        <DialogClose onClose={() => setShowModal(false)} />
        <DialogHeader>
          <DialogTitle>{editingSub ? 'Edit Subcontractor' : 'Add Subcontractor'}</DialogTitle>
        </DialogHeader>
        <DialogBody className="max-h-[70vh] overflow-y-auto space-y-6">
          {/* Company Info */}
          <section>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Company Info
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label required>Company Name</Label>
                <Input
                  value={form.company_name || ''}
                  onChange={e => setForm({ ...form, company_name: e.target.value })}
                  placeholder="ABC Plumbing LLC"
                />
              </div>
              <div>
                <Label>Contact Name</Label>
                <Input
                  value={form.contact_name || ''}
                  onChange={e => setForm({ ...form, contact_name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email || ''}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="john@abcplumbing.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone || ''}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label>EIN</Label>
                <Input
                  value={form.ein || ''}
                  onChange={e => setForm({ ...form, ein: e.target.value })}
                  placeholder="XX-XXXXXXX"
                />
              </div>
              <div>
                <Label>Primary Trade</Label>
                <Select
                  value={form.trade || ''}
                  onChange={e => setForm({ ...form, trade: e.target.value })}
                  options={[{ value: '', label: 'Select...' }, ...TRADE_OPTIONS.map(t => ({ value: t, label: t }))]}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Additional Trades (comma separated)</Label>
                <Input
                  value={tradesInput}
                  onChange={e => setTradesInput(e.target.value)}
                  placeholder="Electrical, Plumbing, HVAC"
                />
              </div>
            </div>
          </section>

          {/* Licensing */}
          <section>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Licensing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>License Number</Label>
                <Input
                  value={form.license_number || ''}
                  onChange={e => setForm({ ...form, license_number: e.target.value })}
                  placeholder="ROC-123456"
                />
              </div>
              <div>
                <Label>License Expiry</Label>
                <Input
                  type="date"
                  value={form.license_expiry || ''}
                  onChange={e => setForm({ ...form, license_expiry: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Insurance / COI */}
          <section>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Insurance / COI
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>General Liability Policy #</Label>
                <Input
                  value={form.general_liability_policy || ''}
                  onChange={e => setForm({ ...form, general_liability_policy: e.target.value })}
                />
              </div>
              <div>
                <Label>GL Expiry</Label>
                <Input
                  type="date"
                  value={form.general_liability_expiry || ''}
                  onChange={e => setForm({ ...form, general_liability_expiry: e.target.value })}
                />
              </div>
              <div>
                <Label>Workers Comp Policy #</Label>
                <Input
                  value={form.workers_comp_policy || ''}
                  onChange={e => setForm({ ...form, workers_comp_policy: e.target.value })}
                />
              </div>
              <div>
                <Label>Workers Comp Expiry</Label>
                <Input
                  type="date"
                  value={form.workers_comp_expiry || ''}
                  onChange={e => setForm({ ...form, workers_comp_expiry: e.target.value })}
                />
              </div>
              <div>
                <Label>Auto Insurance Policy #</Label>
                <Input
                  value={form.auto_insurance_policy || ''}
                  onChange={e => setForm({ ...form, auto_insurance_policy: e.target.value })}
                />
              </div>
              <div>
                <Label>Auto Insurance Expiry</Label>
                <Input
                  type="date"
                  value={form.auto_insurance_expiry || ''}
                  onChange={e => setForm({ ...form, auto_insurance_expiry: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>COI Document URL</Label>
                <Input
                  value={form.coi_file_url || ''}
                  onChange={e => setForm({ ...form, coi_file_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Payment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Payment Method</Label>
                <Select
                  value={form.payment_method || ''}
                  onChange={e => setForm({ ...form, payment_method: e.target.value })}
                  options={PAYMENT_METHOD_OPTIONS}
                />
              </div>
              <div>
                <Label>Rate Type</Label>
                <Select
                  value={form.payment_rate_type || ''}
                  onChange={e => setForm({ ...form, payment_rate_type: e.target.value })}
                  options={PAYMENT_RATE_TYPE_OPTIONS}
                />
              </div>
              <div>
                <Label>Rate ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.payment_rate ?? ''}
                  onChange={e => setForm({ ...form, payment_rate: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.w9_on_file ?? false}
                    onChange={e => setForm({ ...form, w9_on_file: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  W-9 on File
                </label>
              </div>
            </div>
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <StickyNote className="w-4 h-4" /> Notes
            </h3>
            <textarea
              value={form.notes || ''}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
          </section>

          {/* Active toggle (edit only) */}
          {editingSub && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active ?? true}
                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="rounded border-gray-300"
              />
              Active
            </label>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editingSub ? 'Update' : 'Add Subcontractor'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
