'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogClose, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Field {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'select'
  options?: { label: string; value: string }[]
  step?: string
}

interface EditItemModalProps {
  open: boolean
  onClose: () => void
  itemType: string
  itemId: string
  title: string
  fields: Field[]
  initialValues: Record<string, any>
}

export function EditItemModal({ open, onClose, itemType, itemId, title, fields, initialValues }: EditItemModalProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    fields.forEach(f => { init[f.name] = initialValues[f.name]?.toString() ?? '' })
    return init
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updates: Record<string, any> = {}
      fields.forEach(f => {
        const val = form[f.name]
        const orig = initialValues[f.name]?.toString() ?? ''
        if (val !== orig) {
          if (f.type === 'number') updates[f.name] = parseFloat(val) || 0
          else updates[f.name] = val || null
        }
      })

      if (Object.keys(updates).length === 0) { onClose(); setSaving(false); return }

      const res = await fetch('/api/projects/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: itemType, item_id: itemId, ...updates }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to update')
      }
      toast.success(`${title} updated`)
      onClose()
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (!open) return null

  return (
    <Dialog open onClose={onClose}>
      <DialogClose onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Edit {title}</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-3 max-h-[60vh] overflow-y-auto">
          {fields.map(f => (
            <div key={f.name}>
              <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea
                  value={form[f.name]} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-400"
                />
              ) : f.type === 'select' ? (
                <select
                  value={form[f.name]} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-400"
                >
                  {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input
                  type={f.type} value={form[f.name]} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  step={f.step} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
                />
              )}
            </div>
          ))}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
