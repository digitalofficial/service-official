'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogClose, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const STATUS_OPTIONS = [
  { label: 'Lead', value: 'lead' },
  { label: 'Estimating', value: 'estimating' },
  { label: 'Approved', value: 'approved' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Punch List', value: 'punch_list' },
  { label: 'Completed', value: 'completed' },
  { label: 'On Hold', value: 'on_hold' },
]

interface EditProjectModalProps {
  project: any
  open: boolean
  onClose: () => void
}

export function EditProjectModal({ project, open, onClose }: EditProjectModalProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: project.name || '',
    status: project.status || 'lead',
    description: project.description || '',
    contract_value: project.contract_value?.toString() || '',
    estimated_start_date: project.estimated_start_date || '',
    estimated_end_date: project.estimated_end_date || '',
    address_line1: project.address_line1 || '',
    city: project.city || '',
    state: project.state || '',
    zip: project.zip || '',
    permit_number: project.permit_number || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const updates: Record<string, any> = {}
    if (form.name !== project.name) updates.name = form.name
    if (form.status !== project.status) updates.status = form.status
    if (form.description !== (project.description || '')) updates.description = form.description || null
    if (form.contract_value !== (project.contract_value?.toString() || '')) updates.contract_value = parseFloat(form.contract_value) || 0
    if (form.estimated_start_date !== (project.estimated_start_date || '')) updates.estimated_start_date = form.estimated_start_date || null
    if (form.estimated_end_date !== (project.estimated_end_date || '')) updates.estimated_end_date = form.estimated_end_date || null
    if (form.address_line1 !== (project.address_line1 || '')) updates.address_line1 = form.address_line1 || null
    if (form.city !== (project.city || '')) updates.city = form.city || null
    if (form.state !== (project.state || '')) updates.state = form.state || null
    if (form.zip !== (project.zip || '')) updates.zip = form.zip || null
    if (form.permit_number !== (project.permit_number || '')) updates.permit_number = form.permit_number || null

    if (Object.keys(updates).length === 0) {
      onClose()
      setSaving(false)
      return
    }

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to update')
      }
      toast.success('Project updated')
      onClose()
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <Dialog open onClose={onClose}>
      <DialogClose onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label required>Project Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>

          <div>
            <Label>Status</Label>
            <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={STATUS_OPTIONS} />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Project scope and details..." />
          </div>

          <div>
            <Label>Contract Value ($)</Label>
            <Input type="number" step="0.01" value={form.contract_value} onChange={e => setForm(f => ({ ...f, contract_value: e.target.value }))} placeholder="0.00" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={form.estimated_start_date} onChange={e => setForm(f => ({ ...f, estimated_start_date: e.target.value }))} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={form.estimated_end_date} onChange={e => setForm(f => ({ ...f, estimated_end_date: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label>Street Address</Label>
            <Input value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} placeholder="123 Main St" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
            </div>
            <div>
              <Label>ZIP</Label>
              <Input value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label>Permit Number</Label>
            <Input value={form.permit_number} onChange={e => setForm(f => ({ ...f, permit_number: e.target.value }))} placeholder="Optional" />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
