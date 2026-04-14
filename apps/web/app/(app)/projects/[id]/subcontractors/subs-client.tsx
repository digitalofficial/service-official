'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogClose, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Plus, Trash2, Mail, Phone, Shield, ShieldAlert, ShieldX } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Sub {
  id: string
  company_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  trade: string | null
  insurance_expiry: string | null
  general_liability_expiry: string | null
  workers_comp_expiry: string | null
}

interface Assignment {
  id: string
  subcontractor_id: string
  scope: string | null
  contract_amount: number | null
  status: string | null
  start_date: string | null
  end_date: string | null
  notes: string | null
  hours_logged: number | null
  subcontractor: Sub | null
}

function insuranceState(s: Sub | null) {
  if (!s) return 'unknown'
  const dates = [s.insurance_expiry, s.general_liability_expiry, s.workers_comp_expiry].filter(Boolean) as string[]
  if (dates.length === 0) return 'unknown'
  const now = new Date()
  const soon = new Date(now.getTime() + 30 * 86400000)
  let worst: 'valid' | 'expiring_soon' | 'expired' = 'valid'
  for (const d of dates) {
    const exp = new Date(d)
    if (exp < now) return 'expired'
    if (exp < soon) worst = 'expiring_soon'
  }
  return worst
}

function InsuranceBadge({ status }: { status: string }) {
  const cls = 'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium'
  if (status === 'expired') return <span className={`${cls} bg-red-100 text-red-700`}><ShieldX className="w-3 h-3" />Expired</span>
  if (status === 'expiring_soon') return <span className={`${cls} bg-amber-100 text-amber-700`}><ShieldAlert className="w-3 h-3" />Expiring</span>
  if (status === 'valid') return <span className={`${cls} bg-emerald-100 text-emerald-700`}><Shield className="w-3 h-3" />Valid</span>
  return <span className={`${cls} bg-gray-100 text-gray-600`}>No COI</span>
}

export function ProjectSubsClient({
  projectId,
  initialAssignments,
  availableSubs,
}: {
  projectId: string
  initialAssignments: Assignment[]
  availableSubs: Pick<Sub, 'id' | 'company_name' | 'trade'>[]
}) {
  const router = useRouter()
  const [assignments, setAssignments] = useState(initialAssignments)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    subcontractor_id: '',
    scope: '',
    contract_amount: '',
    start_date: '',
    end_date: '',
    notes: '',
  })

  const assignedIds = new Set(assignments.map(a => a.subcontractor_id))
  const selectable = availableSubs.filter(s => !assignedIds.has(s.id))

  async function handleAssign() {
    if (!form.subcontractor_id) {
      toast.error('Pick a subcontractor')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/subcontractors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subcontractor_id: form.subcontractor_id,
          scope: form.scope || null,
          contract_amount: form.contract_amount ? Number(form.contract_amount) : null,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          notes: form.notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Failed to assign')
        return
      }
      toast.success('Subcontractor assigned')
      setShowAdd(false)
      setForm({ subcontractor_id: '', scope: '', contract_amount: '', start_date: '', end_date: '', notes: '' })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(a: Assignment) {
    if (!confirm(`Remove ${a.subcontractor?.company_name} from this project?`)) return
    const res = await fetch(`/api/projects/${projectId}/subcontractors/${a.id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Failed to remove')
      return
    }
    setAssignments(assignments.filter(x => x.id !== a.id))
    toast.success('Removed')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)} disabled={selectable.length === 0}>
          <Plus className="w-4 h-4 mr-2" /> Assign Subcontractor
        </Button>
      </div>

      {assignments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assignments.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{a.subcontractor?.company_name}</h3>
                    <InsuranceBadge status={insuranceState(a.subcontractor)} />
                  </div>
                  {a.subcontractor?.trade && (
                    <p className="text-xs text-purple-700 mt-0.5">{a.subcontractor.trade}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    {a.subcontractor?.email && <a href={`mailto:${a.subcontractor.email}`} className="flex items-center gap-1"><Mail className="w-3 h-3" />{a.subcontractor.email}</a>}
                    {a.subcontractor?.phone && <a href={`tel:${a.subcontractor.phone}`} className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.subcontractor.phone}</a>}
                  </div>
                  {a.scope && <p className="text-sm text-gray-700 mt-2">{a.scope}</p>}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600">
                    {a.contract_amount != null && <div><span className="text-gray-400">Contract:</span> ${Number(a.contract_amount).toLocaleString()}</div>}
                    {a.hours_logged != null && <div><span className="text-gray-400">Hours:</span> {a.hours_logged}</div>}
                    {a.start_date && <div><span className="text-gray-400">Start:</span> {a.start_date}</div>}
                    {a.end_date && <div><span className="text-gray-400">End:</span> {a.end_date}</div>}
                    {a.status && <div className="capitalize"><span className="text-gray-400">Status:</span> {a.status}</div>}
                  </div>
                  {a.notes && <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">{a.notes}</p>}
                </div>
                <button
                  onClick={() => handleRemove(a)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} className="max-w-lg">
        <DialogClose onClose={() => setShowAdd(false)} />
        <DialogHeader>
          <DialogTitle>Assign Subcontractor</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <div>
            <Label required>Subcontractor</Label>
            <Select
              value={form.subcontractor_id}
              onChange={e => setForm({ ...form, subcontractor_id: e.target.value })}
              options={[
                { value: '', label: 'Select a subcontractor...' },
                ...selectable.map(s => ({ value: s.id, label: s.trade ? `${s.company_name} (${s.trade})` : s.company_name })),
              ]}
            />
            {selectable.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">All active subcontractors are already assigned. Add new ones from Team → Subcontractors.</p>
            )}
          </div>
          <div>
            <Label>Scope of Work</Label>
            <textarea
              value={form.scope}
              onChange={e => setForm({ ...form, scope: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. Rough-in plumbing for entire floor"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contract Amount ($)</Label>
              <Input type="number" step="0.01" value={form.contract_amount} onChange={e => setForm({ ...form, contract_amount: e.target.value })} />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAdd(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleAssign} disabled={saving || !form.subcontractor_id}>{saving ? 'Assigning...' : 'Assign'}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
