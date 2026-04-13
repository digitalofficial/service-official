'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Plus, Upload, Download, Pencil, Trash2, Loader2, Hash } from 'lucide-react'
import { toast } from 'sonner'

interface CostCode {
  id: string
  code: string
  name: string
  description: string | null
  category: string | null
  parent_code: string | null
  is_active: boolean
}

const CSI_CODES = [
  { code: '01', name: 'General Requirements', category: 'General' },
  { code: '02', name: 'Existing Conditions', category: 'General' },
  { code: '03', name: 'Concrete', category: 'Structural' },
  { code: '04', name: 'Masonry', category: 'Structural' },
  { code: '05', name: 'Metals', category: 'Structural' },
  { code: '06', name: 'Wood/Plastics/Composites', category: 'Structural' },
  { code: '07', name: 'Thermal/Moisture Protection', category: 'Envelope' },
  { code: '08', name: 'Openings', category: 'Envelope' },
  { code: '09', name: 'Finishes', category: 'Interiors' },
  { code: '10', name: 'Specialties', category: 'Interiors' },
  { code: '11', name: 'Equipment', category: 'Interiors' },
  { code: '12', name: 'Furnishings', category: 'Interiors' },
  { code: '13', name: 'Special Construction', category: 'Special' },
  { code: '14', name: 'Conveying Equipment', category: 'Special' },
  { code: '21', name: 'Fire Suppression', category: 'Mechanical' },
  { code: '22', name: 'Plumbing', category: 'Mechanical' },
  { code: '23', name: 'HVAC', category: 'Mechanical' },
  { code: '26', name: 'Electrical', category: 'Electrical' },
  { code: '27', name: 'Communications', category: 'Electrical' },
  { code: '28', name: 'Electronic Safety', category: 'Electrical' },
  { code: '31', name: 'Earthwork', category: 'Site' },
  { code: '32', name: 'Exterior Improvements', category: 'Site' },
  { code: '33', name: 'Utilities', category: 'Site' },
]

export default function CostCodesPage() {
  const [codes, setCodes] = useState<CostCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingCode, setEditingCode] = useState<CostCode | null>(null)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchCodes() }, [])

  async function fetchCodes() {
    try {
      const res = await fetch('/api/cost-codes')
      if (res.ok) {
        const { data } = await res.json()
        setCodes(data || [])
      }
    } catch {
      toast.error('Failed to load cost codes')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    try {
      const fd = new FormData(e.currentTarget)
      const body = {
        code: fd.get('code'),
        name: fd.get('name'),
        description: fd.get('description') || null,
        category: fd.get('category') || null,
      }

      const isEdit = !!editingCode
      const url = isEdit ? `/api/cost-codes/${editingCode.id}` : '/api/cost-codes'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to save')
        return
      }

      toast.success(isEdit ? 'Cost code updated' : 'Cost code created')
      setShowAdd(false)
      setEditingCode(null)
      fetchCodes()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this cost code?')) return

    try {
      const res = await fetch(`/api/cost-codes/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to delete')
        return
      }
      toast.success('Cost code deleted')
      fetchCodes()
    } catch {
      toast.error('Something went wrong')
    }
  }

  async function handleLoadCSI() {
    setSeeding(true)
    try {
      const res = await fetch('/api/cost-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(CSI_CODES),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to load CSI codes')
        return
      }

      toast.success('CSI MasterFormat codes loaded')
      fetchCodes()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSeeding(false)
    }
  }

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) {
        toast.error('CSV must have a header row and at least one data row')
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const codeIdx = headers.indexOf('code')
      const nameIdx = headers.indexOf('name')

      if (codeIdx === -1 || nameIdx === -1) {
        toast.error('CSV must have "code" and "name" columns')
        return
      }

      const descIdx = headers.indexOf('description')
      const catIdx = headers.indexOf('category')

      const items = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim())
        return {
          code: cols[codeIdx],
          name: cols[nameIdx],
          description: descIdx >= 0 ? cols[descIdx] || null : null,
          category: catIdx >= 0 ? cols[catIdx] || null : null,
        }
      }).filter(item => item.code && item.name)

      if (items.length === 0) {
        toast.error('No valid rows found in CSV')
        return
      }

      const res = await fetch('/api/cost-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to import')
        return
      }

      toast.success(`Imported ${items.length} cost codes`)
      fetchCodes()
    } catch {
      toast.error('Failed to parse CSV')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleToggleActive(code: CostCode) {
    try {
      const res = await fetch(`/api/cost-codes/${code.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !code.is_active }),
      })
      if (res.ok) {
        fetchCodes()
      }
    } catch {
      toast.error('Failed to update')
    }
  }

  const showDialog = showAdd || !!editingCode

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Cost Codes</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleLoadCSI} disabled={seeding}>
            {seeding ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}
            Load CSI Standard Codes
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1" />Import CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1" />Add Cost Code
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : codes.length === 0 ? (
        <EmptyState
          icon={<Hash className="w-12 h-12" />}
          title="No cost codes"
          description="Add cost codes manually, import from CSV, or load CSI standard codes."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Description</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Active</th>
                <th className="w-20 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{code.code}</td>
                  <td className="px-4 py-3 text-gray-900">{code.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{code.category ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell truncate max-w-[200px]">{code.description ?? '-'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleActive(code)}>
                      <Badge variant={code.is_active ? 'success' : 'secondary'}>
                        {code.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingCode(code)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onClose={() => { setShowAdd(false); setEditingCode(null) }}>
        <DialogClose onClose={() => { setShowAdd(false); setEditingCode(null) }} />
        <DialogHeader>
          <DialogTitle>{editingCode ? 'Edit Cost Code' : 'Add Cost Code'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave}>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cc-code" required>Code</Label>
                <Input id="cc-code" name="code" placeholder="03" defaultValue={editingCode?.code ?? ''} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cc-category">Category</Label>
                <Input id="cc-category" name="category" placeholder="Structural" defaultValue={editingCode?.category ?? ''} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-name" required>Name</Label>
              <Input id="cc-name" name="name" placeholder="Concrete" defaultValue={editingCode?.name ?? ''} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-desc">Description</Label>
              <Input id="cc-desc" name="description" placeholder="Optional description" defaultValue={editingCode?.description ?? ''} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setShowAdd(false); setEditingCode(null) }}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingCode ? 'Save Changes' : 'Add Code'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}
