'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { InlineCustomerSelect } from '@/components/forms/inline-customer-select'
import { InlineProjectSelect } from '@/components/forms/inline-project-select'
import { TimeSelect, addHoursToTime } from '@/components/ui/time-select'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
]

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [job, setJob] = useState<any>(null)

  // Editable fields
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('normal')
  const [customerId, setCustomerId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [scheduledEndTime, setScheduledEndTime] = useState('')

  const handleEditStartChange = (time: string) => {
    setScheduledTime(time)
    if (time) setScheduledEndTime(addHoursToTime(time, 1))
  }
  const [addressLine1, setAddressLine1] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [instructions, setInstructions] = useState('')

  useEffect(() => {
    async function fetchJob() {
      const res = await fetch(`/api/jobs/${jobId}`)
      if (!res.ok) {
        toast.error('Job not found')
        router.push('/jobs')
        return
      }
      const { data } = await res.json()
      setJob(data)

      setTitle(data.title ?? '')
      setPriority(data.priority ?? 'normal')
      setCustomerId(data.customer?.id ?? '')
      setProjectId(data.project?.id ?? '')
      setAddressLine1(data.address_line1 ?? '')
      setCity(data.city ?? '')
      setState(data.state ?? '')
      setZip(data.zip ?? '')
      setInstructions(data.instructions ?? '')

      // Parse scheduled start into date + time
      if (data.scheduled_start) {
        const d = new Date(data.scheduled_start)
        setScheduledDate(d.toISOString().split('T')[0])
        setScheduledTime(d.toTimeString().slice(0, 5))
      }
      if (data.scheduled_end) {
        const d = new Date(data.scheduled_end)
        setScheduledEndTime(d.toTimeString().slice(0, 5))
      }

      setLoading(false)
    }
    fetchJob()
  }, [jobId, router])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Job title is required')
      return
    }

    setSaving(true)

    const updates: Record<string, any> = {
      title,
      priority,
      customer_id: customerId || null,
      project_id: projectId || null,
      address_line1: addressLine1 || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      instructions: instructions || null,
    }

    if (scheduledDate && scheduledTime) {
      updates.scheduled_start = `${scheduledDate}T${scheduledTime}:00`
    } else {
      updates.scheduled_start = null
    }

    if (scheduledDate && scheduledEndTime) {
      updates.scheduled_end = `${scheduledDate}T${scheduledEndTime}:00`
    } else {
      updates.scheduled_end = null
    }

    const res = await fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (res.ok) {
      toast.success('Job updated')
      router.push(`/jobs/${jobId}`)
      router.refresh()
    } else {
      const { error } = await res.json()
      toast.error(error ?? 'Failed to update job')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/jobs/${jobId}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Job</h1>
          <p className="text-sm text-gray-500">{job?.job_number}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title" required>Job Title</Label>
          <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required autoFocus />
        </div>

        {/* Customer & Project */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InlineCustomerSelect defaultValue={customerId} required onChange={setCustomerId} />
          <InlineProjectSelect defaultValue={projectId} onChange={setProjectId} />
        </div>

        {/* Priority */}
        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select id="priority" value={priority} onChange={e => setPriority(e.target.value)} options={PRIORITY_OPTIONS} />
        </div>

        {/* Schedule */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Schedule</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="scheduled_date">Date</Label>
              <Input id="scheduled_date" type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <TimeSelect value={scheduledTime} onChange={handleEditStartChange} />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <TimeSelect value={scheduledEndTime} onChange={setScheduledEndTime} />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Location</h3>
          <div className="space-y-1.5">
            <Label htmlFor="address_line1">Street Address</Label>
            <Input id="address_line1" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} placeholder="123 Main St" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="Denver" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={state} onChange={e => setState(e.target.value)} placeholder="CO" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" value={zip} onChange={e => setZip(e.target.value)} placeholder="80202" />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <Label htmlFor="instructions">Instructions for Crew</Label>
          <Textarea id="instructions" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Gate code, parking info, special instructions..." />
        </div>

        {/* Save */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Link href={`/jobs/${jobId}`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
