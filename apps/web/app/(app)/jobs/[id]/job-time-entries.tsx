'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Plus, X, Loader2, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  jobId: string
  assigneeId?: string
  currentUserId: string
  currentUserRole: string
}

interface TimeEntry {
  id: string
  date: string
  start_time?: string
  end_time?: string
  hours: number
  break_minutes: number
  hourly_rate: number
  total_pay: number
  description?: string
  profile: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string
    hourly_rate?: number
    role: string
  }
}

export function JobTimeEntries({ jobId, assigneeId, currentUserId, currentUserRole }: Props) {
  const router = useRouter()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  const isOwnerOrAdmin = ['owner', 'admin', 'office_manager', 'project_manager'].includes(currentUserRole)

  const [form, setForm] = useState({
    profile_id: assigneeId || currentUserId,
    date: new Date().toISOString().split('T')[0],
    start_time: '07:00',
    end_time: '15:00',
    hours: '8',
    break_minutes: '30',
    description: '',
  })

  useEffect(() => {
    fetchEntries()
    fetchTeam()
  }, [])

  const fetchEntries = async () => {
    const res = await fetch(`/api/time-entries?job_id=${jobId}`)
    if (res.ok) {
      const { data } = await res.json()
      setEntries(data ?? [])
    }
    setLoading(false)
  }

  const fetchTeam = async () => {
    const res = await fetch('/api/team')
    if (res.ok) {
      const { data } = await res.json()
      setTeamMembers(data ?? [])
    }
  }

  // Auto-calculate hours from start/end time
  const calcHours = (start: string, end: string, breakMin: string) => {
    if (!start || !end) return ''
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    let mins = (eh * 60 + em) - (sh * 60 + sm) - (parseInt(breakMin) || 0)
    if (mins < 0) mins += 24 * 60
    return (mins / 60).toFixed(2)
  }

  const handleTimeChange = (field: 'start_time' | 'end_time' | 'break_minutes', value: string) => {
    const updated = { ...form, [field]: value }
    const hours = calcHours(
      field === 'start_time' ? value : updated.start_time,
      field === 'end_time' ? value : updated.end_time,
      field === 'break_minutes' ? value : updated.break_minutes,
    )
    setForm({ ...updated, hours: hours || updated.hours })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.hours || parseFloat(form.hours) <= 0) {
      toast.error('Hours must be greater than 0')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          profile_id: form.profile_id,
          date: form.date,
          start_time: form.start_time ? `${form.date}T${form.start_time}:00` : undefined,
          end_time: form.end_time ? `${form.date}T${form.end_time}:00` : undefined,
          hours: parseFloat(form.hours),
          break_minutes: parseInt(form.break_minutes) || 0,
          description: form.description || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }

      toast.success('Time entry added')
      setShowForm(false)
      setForm(f => ({ ...f, description: '' }))
      fetchEntries()
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this time entry?')) return
    const res = await fetch(`/api/time-entries?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Entry deleted')
      fetchEntries()
      router.refresh()
    }
  }

  const totalHours = entries.reduce((s, e) => s + (e.hours ?? 0), 0)
  const totalLabor = entries.reduce((s, e) => s + (e.total_pay ?? 0), 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Crew Hours
          {entries.length > 0 && (
            <span className="text-xs font-normal text-gray-500">
              — {totalHours.toFixed(1)}h{isOwnerOrAdmin && totalLabor > 0 ? ` / $${totalLabor.toFixed(2)} labor` : ''}
            </span>
          )}
        </h2>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
          {showForm ? 'Cancel' : 'Log Hours'}
        </Button>
      </div>

      {/* Add Time Entry Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Employee selector - only for owners/admins */}
            {isOwnerOrAdmin && teamMembers.length > 0 && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600">Employee</label>
                <select
                  value={form.profile_id}
                  onChange={e => setForm(f => ({ ...f, profile_id: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400 bg-white"
                >
                  {teamMembers.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.first_name} {m.last_name} — {m.role?.replace(/_/g, ' ')}{m.hourly_rate ? ` ($${m.hourly_rate}/hr)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-600">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Hours</label>
              <input type="number" step="0.25" min="0" max="24" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Start Time</label>
              <input type="time" value={form.start_time} onChange={e => handleTimeChange('start_time', e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">End Time</label>
              <input type="time" value={form.end_time} onChange={e => handleTimeChange('end_time', e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Break (min)</label>
              <input type="number" min="0" max="120" value={form.break_minutes} onChange={e => handleTimeChange('break_minutes', e.target.value)} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Notes</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Log Hours
            </Button>
          </div>
        </form>
      )}

      {/* Entries List */}
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
      ) : entries.length === 0 && !showForm ? (
        <p className="text-sm text-gray-400 text-center py-4">No hours logged — tap "Log Hours" to start tracking</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {entries.map((entry) => {
            const canDelete = isOwnerOrAdmin || entry.profile.id === currentUserId
            return (
              <div key={entry.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                    {entry.profile.first_name?.[0]}{entry.profile.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {entry.profile.first_name} {entry.profile.last_name}
                      <span className="text-xs text-gray-400 ml-2">
                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {entry.start_time && entry.end_time && (
                        <span>
                          {new Date(entry.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          {' — '}
                          {new Date(entry.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      )}
                      {entry.break_minutes > 0 && <span>({entry.break_minutes}min break)</span>}
                      {entry.description && <span className="truncate max-w-[150px]">{entry.description}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{entry.hours}h</p>
                    {isOwnerOrAdmin && entry.total_pay > 0 && (
                      <p className="text-xs text-gray-400">${entry.total_pay.toFixed(2)}</p>
                    )}
                  </div>
                  {canDelete && (
                    <button onClick={() => handleDelete(entry.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {entries.length > 0 && (
            <div className="flex justify-between pt-2.5 text-sm font-bold text-gray-900">
              <span>Total</span>
              <div className="text-right">
                <span>{totalHours.toFixed(1)}h</span>
                {isOwnerOrAdmin && totalLabor > 0 && (
                  <span className="text-xs font-normal text-gray-400 ml-2">${totalLabor.toFixed(2)}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
