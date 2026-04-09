'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  ArrowLeft, Wrench, Truck, MapPin, Calendar, DollarSign,
  Settings2, AlertTriangle, CheckCircle2, XCircle, Clock,
  Plus, RotateCcw, Shield, Hash
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  available: { color: 'bg-emerald-100 text-emerald-700', label: 'Available' },
  assigned: { color: 'bg-blue-100 text-blue-700', label: 'Assigned' },
  maintenance: { color: 'bg-amber-100 text-amber-700', label: 'Maintenance' },
  repair: { color: 'bg-red-100 text-red-700', label: 'Repair' },
  retired: { color: 'bg-gray-100 text-gray-500', label: 'Retired' },
}

const MAINTENANCE_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  skipped: 'bg-gray-100 text-gray-500',
}

export default function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [equipment, setEquipment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'assignments' | 'maintenance'>('details')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [returning, setReturning] = useState(false)

  useEffect(() => { fetchEquipment() }, [id])

  async function fetchEquipment() {
    setLoading(true)
    const res = await fetch(`/api/equipment/${id}`)
    if (!res.ok) { router.push('/equipment'); return }
    const json = await res.json()
    setEquipment(json.data)
    setLoading(false)
  }

  async function handleReturn() {
    setReturning(true)
    const res = await fetch(`/api/equipment/${id}/return`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    if (res.ok) {
      toast.success('Equipment returned successfully')
      fetchEquipment()
    } else {
      toast.error('Failed to return equipment')
    }
    setReturning(false)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-100 rounded-lg" />
      </div>
    )
  }

  if (!equipment) return null

  const statusCfg = STATUS_CONFIG[equipment.status] || STATUS_CONFIG.available
  const needsService = equipment.next_service_date && new Date(equipment.next_service_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/equipment" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{equipment.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {[equipment.make, equipment.model, equipment.year].filter(Boolean).join(' ')}
              {equipment.type && ` — ${equipment.type}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {equipment.status === 'available' && (
            <Button onClick={() => setShowAssignModal(true)}>
              <Truck className="w-4 h-4 mr-2" />
              Assign
            </Button>
          )}
          {equipment.status === 'assigned' && (
            <Button variant="outline" onClick={handleReturn} disabled={returning}>
              <RotateCcw className="w-4 h-4 mr-2" />
              {returning ? 'Returning...' : 'Return'}
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowMaintenanceModal(true)}>
            <Wrench className="w-4 h-4 mr-2" />
            Log Maintenance
          </Button>
        </div>
      </div>

      {needsService && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Service due on {equipment.next_service_date}. Schedule maintenance to keep this equipment in good condition.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0">
          {(['details', 'assignments', 'maintenance'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {tab === 'assignments' && equipment.assignments?.length > 0 && (
                <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">{equipment.assignments.length}</span>
              )}
              {tab === 'maintenance' && equipment.maintenance?.length > 0 && (
                <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">{equipment.maintenance.length}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Equipment Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {equipment.type && <Detail label="Type" value={equipment.type} />}
              {equipment.make && <Detail label="Make" value={equipment.make} />}
              {equipment.model && <Detail label="Model" value={equipment.model} />}
              {equipment.year && <Detail label="Year" value={equipment.year} />}
              {equipment.serial_number && <Detail label="Serial Number" value={equipment.serial_number} />}
              {equipment.vin && <Detail label="VIN" value={equipment.vin} />}
              {equipment.license_plate && <Detail label="License Plate" value={equipment.license_plate} />}
              <Detail label="Condition" value={equipment.condition} className="capitalize" />
              {equipment.meter_reading != null && <Detail label={`Meter (${equipment.meter_unit})`} value={equipment.meter_reading.toLocaleString()} />}
              {equipment.current_location && <Detail label="Location" value={equipment.current_location} />}
            </div>
          </div>

          {/* Financial Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Financial</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {equipment.purchase_date && <Detail label="Purchase Date" value={equipment.purchase_date} />}
              {equipment.purchase_price != null && <Detail label="Purchase Price" value={fmt(equipment.purchase_price)} />}
              {equipment.current_value != null && <Detail label="Current Value" value={fmt(equipment.current_value)} />}
              {equipment.daily_rate != null && <Detail label="Daily Rate" value={`${fmt(equipment.daily_rate)}/day`} />}
              {equipment.hourly_rate != null && <Detail label="Hourly Rate" value={`${fmt(equipment.hourly_rate)}/hr`} />}
            </div>
          </div>

          {/* Service Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Service & Insurance</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {equipment.last_service_date && <Detail label="Last Service" value={equipment.last_service_date} />}
              {equipment.next_service_date && <Detail label="Next Service" value={equipment.next_service_date} />}
              {equipment.service_interval_days && <Detail label="Service Interval" value={`${equipment.service_interval_days} days`} />}
              {equipment.insurance_policy && <Detail label="Insurance Policy" value={equipment.insurance_policy} />}
              {equipment.insurance_expiry && <Detail label="Insurance Expiry" value={equipment.insurance_expiry} />}
            </div>
          </div>

          {/* Current Assignment */}
          {equipment.current_assignment && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 space-y-3">
              <h2 className="font-semibold text-blue-900">Current Assignment</h2>
              <div className="text-sm space-y-2">
                {equipment.current_assignment.project && (
                  <p><span className="text-blue-700 font-medium">Project:</span>{' '}
                    <Link href={`/projects/${equipment.current_assignment.project.id}`} className="text-blue-600 hover:underline">
                      {equipment.current_assignment.project.name}
                    </Link>
                  </p>
                )}
                {equipment.current_assignment.assignee && (
                  <p><span className="text-blue-700 font-medium">Assigned to:</span> {equipment.current_assignment.assignee.first_name} {equipment.current_assignment.assignee.last_name}</p>
                )}
                <p><span className="text-blue-700 font-medium">Since:</span> {equipment.current_assignment.start_date}</p>
                {equipment.current_assignment.daily_rate && (
                  <p><span className="text-blue-700 font-medium">Rate:</span> {fmt(equipment.current_assignment.daily_rate)}/day</p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {equipment.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
              <h2 className="font-semibold text-gray-900 mb-2">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{equipment.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="bg-white rounded-lg border border-gray-200">
          {equipment.assignments?.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Project</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Assigned To</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Start</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Returned</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Cost</th>
                </tr>
              </thead>
              <tbody>
                {equipment.assignments.map((a: any) => (
                  <tr key={a.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3">
                      {a.project ? (
                        <Link href={`/projects/${a.project.id}`} className="text-blue-600 hover:underline">{a.project.name}</Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {a.assignee ? `${a.assignee.first_name} ${a.assignee.last_name}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.start_date}</td>
                    <td className="px-4 py-3">
                      {a.actual_return_date ? (
                        <span className="text-gray-600">{a.actual_return_date}</span>
                      ) : (
                        <span className="text-blue-600 font-medium">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {a.total_cost ? fmt(a.total_cost) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Truck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p>No assignment history</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowMaintenanceModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Log Maintenance
            </Button>
          </div>
          {equipment.maintenance?.length > 0 ? (
            <div className="space-y-3">
              {equipment.maintenance.map((m: any) => (
                <div key={m.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{m.title}</h3>
                      <p className="text-xs text-gray-500 capitalize">{m.type}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${MAINTENANCE_STATUS_COLORS[m.status] || ''}`}>
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    {m.scheduled_date && <span>Scheduled: {m.scheduled_date}</span>}
                    {m.completed_date && <span>Completed: {m.completed_date}</span>}
                    {m.cost != null && <span>Cost: {fmt(m.cost)}</span>}
                    {m.vendor_name && <span>Vendor: {m.vendor_name}</span>}
                    {m.performer && <span>By: {m.performer.first_name} {m.performer.last_name}</span>}
                  </div>
                  {m.notes && <p className="mt-2 text-sm text-gray-600">{m.notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 text-gray-500">
              <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p>No maintenance records</p>
            </div>
          )}
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <AssignModal
          equipmentId={id}
          dailyRate={equipment.daily_rate}
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => { setShowAssignModal(false); fetchEquipment() }}
        />
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <MaintenanceModal
          equipmentId={id}
          onClose={() => setShowMaintenanceModal(false)}
          onSaved={() => { setShowMaintenanceModal(false); fetchEquipment() }}
        />
      )}
    </div>
  )
}

function Detail({ label, value, className = '' }: { label: string; value: string | number; className?: string }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className={`font-medium text-gray-900 ${className}`}>{value}</p>
    </div>
  )
}

function AssignModal({ equipmentId, dailyRate, onClose, onAssigned }: { equipmentId: string; dailyRate?: number; onClose: () => void; onAssigned: () => void }) {
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [form, setForm] = useState({
    project_id: '', assigned_to: '', start_date: new Date().toISOString().split('T')[0],
    end_date: '', daily_rate: dailyRate?.toString() || '', notes: '',
  })

  useEffect(() => {
    fetch('/api/projects?status=in_progress').then(r => r.json()).then(d => setProjects(d.data || []))
    fetch('/api/team').then(r => r.json()).then(d => setTeam(d.data || []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/equipment/${equipmentId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: form.project_id || undefined,
        assigned_to: form.assigned_to || undefined,
        start_date: form.start_date,
        end_date: form.end_date || undefined,
        daily_rate: form.daily_rate ? parseFloat(form.daily_rate) : undefined,
        notes: form.notes || undefined,
      }),
    })
    if (res.ok) {
      toast.success('Equipment assigned')
      onAssigned()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to assign')
    }
    setSaving(false)
  }

  return (
    <Dialog open onClose={onClose} title="Assign Equipment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Project</Label>
          <Select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} options={[
            { value: '', label: 'Select a project...' },
            ...projects.map((p: any) => ({ value: p.id, label: p.name }))
          ]} />
        </div>
        <div>
          <Label>Assign To</Label>
          <Select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} options={[
            { value: '', label: 'Select team member...' },
            ...team.map((t: any) => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label required>Start Date</Label>
            <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required />
          </div>
          <div>
            <Label>Expected Return</Label>
            <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
          </div>
        </div>
        <div>
          <Label>Daily Rate ($)</Label>
          <Input type="number" step="0.01" value={form.daily_rate} onChange={e => setForm(f => ({ ...f, daily_rate: e.target.value }))} />
        </div>
        <div>
          <Label>Notes</Label>
          <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Assigning...' : 'Assign'}</Button>
        </div>
      </form>
    </Dialog>
  )
}

function MaintenanceModal({ equipmentId, onClose, onSaved }: { equipmentId: string; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', type: 'preventive', description: '', scheduled_date: new Date().toISOString().split('T')[0],
    completed_date: '', cost: '', vendor_name: '', meter_reading: '', notes: '', status: 'scheduled',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/equipment/${equipmentId}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        type: form.type,
        description: form.description || undefined,
        scheduled_date: form.scheduled_date || undefined,
        completed_date: form.completed_date || undefined,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        vendor_name: form.vendor_name || undefined,
        meter_reading: form.meter_reading ? parseFloat(form.meter_reading) : undefined,
        notes: form.notes || undefined,
        status: form.status,
      }),
    })
    if (res.ok) {
      toast.success('Maintenance record saved')
      onSaved()
    }
    setSaving(false)
  }

  return (
    <Dialog open onClose={onClose} title="Log Maintenance">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label required>Title</Label>
          <Input placeholder="e.g. Oil change, Tire rotation" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Type</Label>
            <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} options={[
              { value: 'preventive', label: 'Preventive' },
              { value: 'corrective', label: 'Corrective' },
              { value: 'inspection', label: 'Inspection' },
              { value: 'calibration', label: 'Calibration' },
            ]} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={[
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
            ]} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Scheduled Date</Label>
            <Input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} />
          </div>
          <div>
            <Label>Completed Date</Label>
            <Input type="date" value={form.completed_date} onChange={e => setForm(f => ({ ...f, completed_date: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Cost ($)</Label>
            <Input type="number" step="0.01" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
          </div>
          <div>
            <Label>Vendor</Label>
            <Input value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))} placeholder="Vendor name" />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Work performed..." />
        </div>
        <div>
          <Label>Notes</Label>
          <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || !form.title}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </Dialog>
  )
}
