'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  ArrowLeft, CheckCircle2, XCircle, MinusCircle,
  ClipboardCheck, Camera, Type, Hash, List, Pen
} from 'lucide-react'
import type { InspectionItem, ChecklistItemType } from '@service-official/types'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
}

const ITEM_STATUS_CONFIG: Record<string, { bg: string; icon: typeof CheckCircle2 }> = {
  pass: { bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  fail: { bg: 'bg-red-50 border-red-200', icon: XCircle },
  na: { bg: 'bg-gray-50 border-gray-200', icon: MinusCircle },
  pending: { bg: 'bg-white border-gray-200', icon: ClipboardCheck },
}

export default function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [inspection, setInspection] = useState<any>(null)
  const [items, setItems] = useState<InspectionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchInspection() }, [id])

  async function fetchInspection() {
    setLoading(true)
    const res = await fetch(`/api/inspections/${id}`)
    if (!res.ok) { router.push('/inspections'); return }
    const json = await res.json()
    setInspection(json.data)
    setItems(json.data?.items || [])
    setLoading(false)
  }

  async function updateItem(itemId: string, updates: Partial<InspectionItem>) {
    // Optimistic update
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i))

    await fetch(`/api/inspections/${id}/items`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, ...updates }),
    })
  }

  async function handleComplete() {
    const res = await fetch(`/api/inspections/${id}/complete`, { method: 'POST' })
    if (res.ok) {
      toast.success('Inspection completed')
      fetchInspection()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Cannot complete')
    }
  }

  if (loading) return <div className="animate-pulse space-y-6"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-96 bg-gray-100 rounded-lg" /></div>
  if (!inspection) return null

  // Group items by section
  const sections = new Map<string, InspectionItem[]>()
  for (const item of items) {
    const key = item.section_name || 'General'
    if (!sections.has(key)) sections.set(key, [])
    sections.get(key)!.push(item)
  }

  const passCount = items.filter(i => i.status === 'pass').length
  const failCount = items.filter(i => i.status === 'fail').length
  const naCount = items.filter(i => i.status === 'na').length
  const pendingCount = items.filter(i => i.status === 'pending').length
  const answeredCount = items.length - pendingCount
  const progress = items.length > 0 ? Math.round(answeredCount / items.length * 100) : 0
  const isComplete = ['completed', 'failed'].includes(inspection.status)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inspections" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{inspection.title}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[inspection.status] || ''}`}>
                {inspection.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {inspection.inspection_number}
              {inspection.project && <> — <Link href={`/projects/${inspection.project.id}`} className="text-blue-600 hover:underline">{inspection.project.name}</Link></>}
            </p>
          </div>
        </div>
        {!isComplete && (
          <Button onClick={handleComplete} disabled={pendingCount === items.length}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Complete Inspection
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">{answeredCount} / {items.length} items</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
          <div className="h-2.5 rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {passCount} Pass</span>
          <span className="flex items-center gap-1.5"><XCircle className="w-4 h-4 text-red-500" /> {failCount} Fail</span>
          <span className="flex items-center gap-1.5"><MinusCircle className="w-4 h-4 text-gray-400" /> {naCount} N/A</span>
          <span className="flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4 text-blue-400" /> {pendingCount} Pending</span>
        </div>
      </div>

      {/* Inspection Items by Section */}
      {Array.from(sections.entries()).map(([sectionName, sectionItems]) => (
        <div key={sectionName} className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide px-1">{sectionName}</h2>
          <div className="space-y-2">
            {sectionItems.map(item => (
              <InspectionItemCard
                key={item.id}
                item={item}
                disabled={isComplete}
                onUpdate={(updates) => updateItem(item.id, updates)}
              />
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No checklist items. This inspection was created without a template.</p>
        </div>
      )}
    </div>
  )
}

function InspectionItemCard({ item, disabled, onUpdate }: { item: InspectionItem; disabled: boolean; onUpdate: (u: Partial<InspectionItem>) => void }) {
  const [showNotes, setShowNotes] = useState(!!item.notes)
  const [notes, setNotes] = useState(item.notes || '')
  const cfg = ITEM_STATUS_CONFIG[item.status] || ITEM_STATUS_CONFIG.pending

  function setStatus(status: 'pass' | 'fail' | 'na') {
    if (disabled) return
    onUpdate({ status: item.status === status ? 'pending' : status })
  }

  function handleNotesBlur() {
    if (notes !== item.notes) onUpdate({ notes })
  }

  return (
    <div className={`rounded-lg border p-4 transition-colors ${cfg.bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{item.label}</span>
            {item.is_required && <span className="text-red-500 text-xs">*</span>}
          </div>
          {item.type !== 'pass_fail' && item.type !== 'checkbox' && (
            <p className="text-xs text-gray-400 capitalize mt-0.5">{item.type}</p>
          )}
        </div>

        {/* Response controls based on type */}
        {(item.type === 'pass_fail' || item.type === 'checkbox') && (
          <div className="flex gap-1.5">
            <button
              onClick={() => setStatus('pass')}
              disabled={disabled}
              className={`p-1.5 rounded-lg border transition-colors ${item.status === 'pass' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-gray-400 hover:border-emerald-300 hover:text-emerald-500'}`}
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setStatus('fail')}
              disabled={disabled}
              className={`p-1.5 rounded-lg border transition-colors ${item.status === 'fail' ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 text-gray-400 hover:border-red-300 hover:text-red-500'}`}
            >
              <XCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setStatus('na')}
              disabled={disabled}
              className={`p-1.5 rounded-lg border transition-colors ${item.status === 'na' ? 'bg-gray-500 border-gray-500 text-white' : 'border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500'}`}
            >
              <MinusCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {item.type === 'text' && (
          <Input
            className="w-64"
            placeholder="Enter response..."
            value={item.value || ''}
            onChange={e => onUpdate({ value: e.target.value, status: e.target.value ? 'pass' : 'pending' })}
            disabled={disabled}
          />
        )}

        {item.type === 'number' && (
          <Input
            type="number"
            className="w-32"
            placeholder="0"
            value={item.value || ''}
            onChange={e => onUpdate({ value: e.target.value, status: e.target.value ? 'pass' : 'pending' })}
            disabled={disabled}
          />
        )}

        {item.type === 'select' && (
          <select
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            value={item.value || ''}
            onChange={e => onUpdate({ value: e.target.value, status: e.target.value ? 'pass' : 'pending' })}
            disabled={disabled}
          >
            <option value="">Select...</option>
            {/* Options would come from template_items.options */}
          </select>
        )}
      </div>

      {/* Notes toggle */}
      <div className="mt-2">
        {showNotes ? (
          <Input
            placeholder="Add notes..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            disabled={disabled}
            className="text-sm"
          />
        ) : (
          !disabled && (
            <button onClick={() => setShowNotes(true)} className="text-xs text-gray-400 hover:text-gray-600">
              + Add notes
            </button>
          )
        )}
      </div>
    </div>
  )
}
