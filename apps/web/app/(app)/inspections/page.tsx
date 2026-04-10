'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ScrollArea } from '@/components/ui/scroll-indicator'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  ClipboardCheck, Plus, Search, AlertTriangle, CheckCircle2, XCircle,
  Clock, Copy, FileText
} from 'lucide-react'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  canceled: 'bg-gray-100 text-gray-500',
}

const RESULT_COLORS: Record<string, string> = {
  pass: 'bg-emerald-100 text-emerald-700',
  fail: 'bg-red-100 text-red-700',
  partial: 'bg-amber-100 text-amber-700',
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeView, setActiveView] = useState<'inspections' | 'templates'>('inspections')

  useEffect(() => {
    fetchInspections()
    fetchTemplates()
  }, [statusFilter])

  async function fetchInspections() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/inspections?${params}`)
    const json = await res.json()
    setInspections(json.data || [])
    setLoading(false)
  }

  async function fetchTemplates() {
    const res = await fetch('/api/inspections/templates')
    const json = await res.json()
    setTemplates(json.data || [])
  }

  async function duplicateTemplate(templateId: string) {
    const res = await fetch(`/api/inspections/templates/${templateId}/duplicate`, { method: 'POST' })
    if (res.ok) {
      toast.success('Template duplicated')
      fetchTemplates()
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const overdue = inspections.filter(i => i.status === 'scheduled' && i.scheduled_date && i.scheduled_date < today)
  const upcoming = inspections.filter(i => i.status === 'scheduled' && i.scheduled_date && i.scheduled_date >= today)
  const completionRate = inspections.length > 0
    ? Math.round(inspections.filter(i => ['completed', 'failed'].includes(i.status)).length / inspections.length * 100)
    : 0

  const filtered = inspections.filter(i =>
    !search || i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.inspection_number?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspections"
        count={inspections.length}
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Inspection
          </Button>
        }
      />

      {/* Compliance Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{inspections.length}</p>
        </div>
        <div className={`rounded-lg border p-4 ${overdue.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <p className={`text-sm ${overdue.length > 0 ? 'text-red-600' : 'text-gray-500'}`}>Overdue</p>
          <p className={`text-2xl font-bold ${overdue.length > 0 ? 'text-red-700' : 'text-gray-900'}`}>{overdue.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Upcoming</p>
          <p className="text-2xl font-bold text-blue-600">{upcoming.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Completion Rate</p>
          <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        <button onClick={() => setActiveView('inspections')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${activeView === 'inspections' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          Inspections
        </button>
        <button onClick={() => setActiveView('templates')} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${activeView === 'templates' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          Templates ({templates.length})
        </button>
      </div>

      {activeView === 'inspections' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search inspections..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <ScrollArea>
              <div className="flex gap-1">
                {STATUS_TABS.map(tab => (
                  <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap shrink-0 transition-colors ${statusFilter === tab.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Inspections List */}
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No inspections found</h3>
              <p className="text-sm text-gray-500 mb-4">Create your first inspection to start tracking quality and safety</p>
              <Button onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4 mr-2" />New Inspection</Button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[650px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Inspection</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Project</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Assigned To</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Result</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(insp => (
                    <tr key={insp.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/inspections/${insp.id}`} className="text-blue-600 hover:underline font-medium">{insp.title}</Link>
                        <p className="text-xs text-gray-400">{insp.inspection_number}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {insp.project ? <Link href={`/projects/${insp.project.id}`} className="text-blue-600 hover:underline">{insp.project.name}</Link> : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{insp.assignee ? `${insp.assignee.first_name} ${insp.assignee.last_name}` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[insp.status] || ''}`}>
                          {insp.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {insp.overall_result ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${RESULT_COLORS[insp.overall_result] || ''}`}>
                            {insp.overall_result} ({insp.pass_count}/{insp.total_items})
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{insp.scheduled_date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        /* Templates View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{t.name}</h3>
                  {t.trade && <p className="text-xs text-gray-500 capitalize">{t.trade}</p>}
                </div>
                {t.is_system && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">System</span>}
              </div>
              {t.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{t.description}</p>}
              {t.category && <span className="inline-flex px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize mb-3">{t.category}</span>}
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <Button variant="outline" size="sm" onClick={() => duplicateTemplate(t.id)}>
                  <Copy className="w-3 h-3 mr-1.5" />Clone
                </Button>
                <Link href={`/inspections/templates/${t.id}`}>
                  <Button variant="outline" size="sm"><FileText className="w-3 h-3 mr-1.5" />View</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Inspection Modal */}
      {showCreateModal && (
        <CreateInspectionModal
          templates={templates}
          onClose={() => setShowCreateModal(false)}
          onCreated={(id) => { setShowCreateModal(false); window.location.href = `/inspections/${id}` }}
        />
      )}
    </div>
  )
}

function CreateInspectionModal({ templates, onClose, onCreated }: { templates: any[]; onClose: () => void; onCreated: (id: string) => void }) {
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [form, setForm] = useState({
    title: '', template_id: '', project_id: '', scheduled_date: new Date().toISOString().split('T')[0], location: '',
  })

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(d.data || []))
  }, [])

  // Auto-fill title from template
  useEffect(() => {
    if (form.template_id && !form.title) {
      const t = templates.find(t => t.id === form.template_id)
      if (t) setForm(f => ({ ...f, title: t.name }))
    }
  }, [form.template_id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        template_id: form.template_id || undefined,
        project_id: form.project_id || undefined,
        scheduled_date: form.scheduled_date || undefined,
        location: form.location || undefined,
      }),
    })
    if (res.ok) {
      const { data } = await res.json()
      toast.success('Inspection created')
      onCreated(data.id)
    }
    setSaving(false)
  }

  return (
    <Dialog open onClose={onClose} title="New Inspection">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Template</Label>
          <Select value={form.template_id} onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))} options={[
            { value: '', label: 'No template (blank inspection)' },
            ...templates.map(t => ({ value: t.id, label: `${t.name}${t.is_system ? ' (System)' : ''}` })),
          ]} />
        </div>
        <div>
          <Label required>Title</Label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        </div>
        <div>
          <Label>Project</Label>
          <Select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} options={[
            { value: '', label: 'No project' },
            ...projects.map(p => ({ value: p.id, label: p.name })),
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Scheduled Date</Label>
            <Input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Building A, Floor 2" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || !form.title}>{saving ? 'Creating...' : 'Create'}</Button>
        </div>
      </form>
    </Dialog>
  )
}
