'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogClose, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { HardHat, Plus, Trash2, Mail, Phone, BadgeCheck } from 'lucide-react'
import { toast } from 'sonner'

interface Sub {
  id: string
  company_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  trade: string | null
}

interface Assignment {
  id: string
  subcontractor_id: string
  scope: string | null
  status: string | null
  hours_logged: number | null
  notes: string | null
  notified_at: string | null
  subcontractor: Sub | null
}

export function JobSubcontractors({ jobId }: { jobId: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [availableSubs, setAvailableSubs] = useState<Sub[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ subcontractor_id: '', scope: '', notes: '' })

  async function load() {
    setLoading(true)
    try {
      const [aRes, sRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}/subcontractors`).then(r => r.json()),
        fetch('/api/subcontractors').then(r => r.json()),
      ])
      setAssignments(aRes.data || [])
      setAvailableSubs(sRes.data || [])
    } catch {
      toast.error('Failed to load subcontractors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [jobId])

  const assignedIds = new Set(assignments.map(a => a.subcontractor_id))
  const selectable = availableSubs.filter(s => !assignedIds.has(s.id))

  async function handleAssign() {
    if (!form.subcontractor_id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/jobs/${jobId}/subcontractors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subcontractor_id: form.subcontractor_id,
          scope: form.scope || null,
          notes: form.notes || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Failed to assign')
        return
      }
      toast.success('Subcontractor assigned' + (json.data?.notified_at ? ' and notified' : ''))
      setShowAdd(false)
      setForm({ subcontractor_id: '', scope: '', notes: '' })
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(a: Assignment) {
    if (!confirm(`Remove ${a.subcontractor?.company_name} from this job?`)) return
    const res = await fetch(`/api/jobs/${jobId}/subcontractors/${a.id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Failed to remove')
      return
    }
    setAssignments(assignments.filter(x => x.id !== a.id))
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <HardHat className="w-4 h-4" /> Subcontractors ({assignments.length})
        </h2>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" /> Assign
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : assignments.length === 0 ? (
        <p className="text-sm text-gray-500">No subcontractors on this job yet.</p>
      ) : (
        <div className="space-y-2">
          {assignments.map(a => (
            <div key={a.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{a.subcontractor?.company_name}</span>
                  {a.subcontractor?.trade && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{a.subcontractor.trade}</span>
                  )}
                  {a.notified_at && (
                    <span className="text-xs text-emerald-600 inline-flex items-center gap-0.5"><BadgeCheck className="w-3 h-3" />Notified</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  {a.subcontractor?.email && <a href={`mailto:${a.subcontractor.email}`} className="flex items-center gap-1"><Mail className="w-3 h-3" />{a.subcontractor.email}</a>}
                  {a.subcontractor?.phone && <a href={`tel:${a.subcontractor.phone}`} className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.subcontractor.phone}</a>}
                </div>
                {a.scope && <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{a.scope}</p>}
                {a.notes && <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{a.notes}</p>}
              </div>
              <button
                onClick={() => handleRemove(a)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} className="max-w-md">
        <DialogClose onClose={() => setShowAdd(false)} />
        <DialogHeader>
          <DialogTitle>Assign Subcontractor to Job</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <div>
            <Label required>Subcontractor</Label>
            <Select
              value={form.subcontractor_id}
              onChange={e => setForm({ ...form, subcontractor_id: e.target.value })}
              options={[
                { value: '', label: 'Select...' },
                ...selectable.map(s => ({ value: s.id, label: s.trade ? `${s.company_name} (${s.trade})` : s.company_name })),
              ]}
            />
            {selectable.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">All active subcontractors are already assigned to this job.</p>
            )}
          </div>
          <div>
            <Label>Scope</Label>
            <textarea
              value={form.scope}
              onChange={e => setForm({ ...form, scope: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="What will they do on this job?"
            />
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
          <p className="text-xs text-gray-500">Assigning will email the subcontractor with job details if they have an email on file.</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAdd(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleAssign} disabled={saving || !form.subcontractor_id}>{saving ? 'Assigning...' : 'Assign & Notify'}</Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
