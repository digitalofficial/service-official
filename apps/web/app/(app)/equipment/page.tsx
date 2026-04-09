'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import {
  Wrench, Plus, Search, Truck, AlertTriangle,
  CheckCircle2, XCircle, PauseCircle, Settings2, MapPin
} from 'lucide-react'
import type { Equipment } from '@service-official/types'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'available', label: 'Available' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'repair', label: 'Repair' },
  { value: 'retired', label: 'Retired' },
]

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  available: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  assigned: { color: 'bg-blue-100 text-blue-700', icon: Truck },
  maintenance: { color: 'bg-amber-100 text-amber-700', icon: Settings2 },
  repair: { color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  retired: { color: 'bg-gray-100 text-gray-500', icon: XCircle },
}

const CONDITION_COLORS: Record<string, string> = {
  excellent: 'text-emerald-600',
  good: 'text-blue-600',
  fair: 'text-amber-600',
  poor: 'text-red-600',
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchEquipment()
  }, [statusFilter])

  async function fetchEquipment() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/equipment?${params}`)
    const json = await res.json()
    setEquipment(json.data || [])
    setLoading(false)
  }

  const filtered = equipment.filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.type?.toLowerCase().includes(search.toLowerCase()) ||
    e.make?.toLowerCase().includes(search.toLowerCase()) ||
    e.model?.toLowerCase().includes(search.toLowerCase()) ||
    e.serial_number?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: equipment.length,
    available: equipment.filter(e => e.status === 'available').length,
    assigned: equipment.filter(e => e.status === 'assigned').length,
    maintenance: equipment.filter(e => e.status === 'maintenance' || e.status === 'repair').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment"
        count={stats.total}
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Equipment
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
          <p className="text-sm text-gray-500">Available</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.available}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Assigned</p>
          <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Maintenance/Repair</p>
          <p className="text-2xl font-bold text-amber-600">{stats.maintenance}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, type, make, model, serial..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          options={STATUS_OPTIONS}
          className="w-full sm:w-48"
        />
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No equipment found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {search ? 'Try adjusting your search' : 'Add your first piece of equipment to get started'}
          </p>
          {!search && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Equipment
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => {
            const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.available
            const StatusIcon = statusCfg.icon
            const needsService = item.next_service_date && new Date(item.next_service_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

            return (
              <Link
                key={item.id}
                href={`/equipment/${item.id}`}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                    {(item.make || item.model) && (
                      <p className="text-sm text-gray-500 truncate">
                        {[item.make, item.model, item.year].filter(Boolean).join(' ')}
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm">
                  {item.type && (
                    <p className="text-gray-500">
                      <span className="font-medium text-gray-700">Type:</span> {item.type}
                    </p>
                  )}
                  {item.serial_number && (
                    <p className="text-gray-500">
                      <span className="font-medium text-gray-700">S/N:</span> {item.serial_number}
                    </p>
                  )}
                  {item.current_location && (
                    <p className="text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.current_location}
                    </p>
                  )}
                  {item.condition && (
                    <p className="text-gray-500">
                      <span className="font-medium text-gray-700">Condition:</span>{' '}
                      <span className={`capitalize ${CONDITION_COLORS[item.condition] || ''}`}>{item.condition}</span>
                    </p>
                  )}
                  {item.daily_rate && (
                    <p className="text-gray-500">
                      <span className="font-medium text-gray-700">Rate:</span> ${item.daily_rate}/day
                    </p>
                  )}
                </div>

                {needsService && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
                    <AlertTriangle className="w-3 h-3" />
                    Service due {item.next_service_date}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* Create Equipment Modal */}
      {showCreateModal && (
        <CreateEquipmentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); fetchEquipment() }}
        />
      )}
    </div>
  )
}

function CreateEquipmentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', type: '', make: '', model: '', year: '',
    serial_number: '', daily_rate: '', hourly_rate: '',
    condition: 'good', meter_unit: 'hours', notes: '',
    purchase_price: '', current_value: '',
    insurance_policy: '', insurance_expiry: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        type: form.type || undefined,
        make: form.make || undefined,
        model: form.model || undefined,
        year: form.year ? parseInt(form.year) : undefined,
        serial_number: form.serial_number || undefined,
        daily_rate: form.daily_rate ? parseFloat(form.daily_rate) : undefined,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : undefined,
        condition: form.condition,
        meter_unit: form.meter_unit,
        notes: form.notes || undefined,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : undefined,
        current_value: form.current_value ? parseFloat(form.current_value) : undefined,
        insurance_policy: form.insurance_policy || undefined,
        insurance_expiry: form.insurance_expiry || undefined,
      }),
    })
    if (res.ok) {
      onCreated()
    }
    setSaving(false)
  }

  return (
    <Dialog open onClose={onClose} title="Add Equipment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label required>Name</Label>
            <Input placeholder="e.g. CAT 320 Excavator" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <Label>Type</Label>
            <Input placeholder="e.g. Excavator, Generator, Truck" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} />
          </div>
          <div>
            <Label>Make</Label>
            <Input placeholder="e.g. Caterpillar" value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} />
          </div>
          <div>
            <Label>Model</Label>
            <Input placeholder="e.g. 320" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
          </div>
          <div>
            <Label>Year</Label>
            <Input type="number" placeholder="e.g. 2022" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
          </div>
          <div>
            <Label>Serial Number</Label>
            <Input placeholder="Serial #" value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} />
          </div>
          <div>
            <Label>Condition</Label>
            <Select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} options={[
              { value: 'excellent', label: 'Excellent' },
              { value: 'good', label: 'Good' },
              { value: 'fair', label: 'Fair' },
              { value: 'poor', label: 'Poor' },
            ]} />
          </div>
          <div>
            <Label>Daily Rate ($)</Label>
            <Input type="number" step="0.01" placeholder="0.00" value={form.daily_rate} onChange={e => setForm(f => ({ ...f, daily_rate: e.target.value }))} />
          </div>
          <div>
            <Label>Hourly Rate ($)</Label>
            <Input type="number" step="0.01" placeholder="0.00" value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))} />
          </div>
          <div>
            <Label>Purchase Price ($)</Label>
            <Input type="number" step="0.01" placeholder="0.00" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} />
          </div>
          <div>
            <Label>Current Value ($)</Label>
            <Input type="number" step="0.01" placeholder="0.00" value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))} />
          </div>
          <div>
            <Label>Meter Unit</Label>
            <Select value={form.meter_unit} onChange={e => setForm(f => ({ ...f, meter_unit: e.target.value }))} options={[
              { value: 'hours', label: 'Hours' },
              { value: 'miles', label: 'Miles' },
              { value: 'kilometers', label: 'Kilometers' },
            ]} />
          </div>
          <div className="sm:col-span-2">
            <Label>Notes</Label>
            <Input placeholder="Any additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || !form.name}>
            {saving ? 'Adding...' : 'Add Equipment'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
