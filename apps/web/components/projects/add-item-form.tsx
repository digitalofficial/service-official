'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Field {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'time'
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
  defaultValue?: string
  colSpan?: number
  step?: string
  min?: string
}

interface AddItemFormProps {
  projectId: string
  itemType: string
  buttonLabel: string
  formTitle: string
  fields: Field[]
  extraData?: Record<string, any>
}

export function AddItemForm({ projectId, itemType, buttonLabel, formTitle, fields, extraData }: AddItemFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    fields.forEach(f => { init[f.name] = f.defaultValue ?? '' })
    return init
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data: Record<string, any> = { type: itemType, project_id: projectId, ...extraData }
      fields.forEach(f => {
        const val = form[f.name]
        if (!val && !f.required) return
        if (f.type === 'number') data[f.name] = parseFloat(val) || 0
        else data[f.name] = val || null
      })

      const res = await fetch('/api/projects/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success(`${formTitle} added`)
      setOpen(false)
      const init: Record<string, string> = {}
      fields.forEach(f => { init[f.name] = f.defaultValue ?? '' })
      setForm(init)
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        <Plus className="w-4 h-4" /> {buttonLabel}
      </button>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{formTitle}</h3>
        <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {fields.map(f => (
            <div key={f.name} className={f.colSpan === 2 ? 'col-span-2' : ''}>
              <label className="text-xs font-medium text-gray-600">{f.label}{f.required ? ' *' : ''}</label>
              {f.type === 'textarea' ? (
                <textarea
                  value={form[f.name]} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  placeholder={f.placeholder} required={f.required} rows={3}
                  className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-400"
                />
              ) : f.type === 'select' ? (
                <select
                  value={form[f.name]} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-400"
                >
                  {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input
                  type={f.type} value={form[f.name]} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  placeholder={f.placeholder} required={f.required} step={f.step} min={f.min}
                  className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
          </button>
        </div>
      </form>
    </div>
  )
}
