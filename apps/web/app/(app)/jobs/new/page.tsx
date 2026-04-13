'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { TimeSelect, addHoursToTime } from '@/components/ui/time-select'
import { InlineCustomerSelect } from '@/components/forms/inline-customer-select'
import { InlineProjectSelect } from '@/components/forms/inline-project-select'
import { toast } from 'sonner'

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
]

export default function NewJobPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillProjectId = searchParams.get('project_id')
  const prefillCustomerId = searchParams.get('customer_id')

  const [loading, setLoading] = useState(false)
  const [jobStartTime, setJobStartTime] = useState('08:00')
  const [jobEndTime, setJobEndTime] = useState('09:00')

  const handleJobStartChange = (time: string) => {
    setJobStartTime(time)
    if (time) setJobEndTime(addHoursToTime(time, 1))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const fd = new FormData(e.currentTarget)
      const body: Record<string, any> = {}
      fd.forEach((v, k) => {
        if (v === '') return
        body[k] = v
      })

      // Convert checkbox to boolean
      body.notify_sms = fd.has('notify_sms')

      // Combine date + time into ISO strings
      if (body.scheduled_date && body.scheduled_time) {
        body.scheduled_start = new Date(`${body.scheduled_date}T${body.scheduled_time}:00`).toISOString()
        delete body.scheduled_date
        delete body.scheduled_time
      }
      if (body.scheduled_end_time && body.scheduled_date) {
        body.scheduled_end = new Date(`${body.scheduled_date}T${body.scheduled_end_time}:00`).toISOString()
        delete body.scheduled_end_time
      }

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to create job')
        return
      }

      const { data } = await res.json()
      toast.success('Job created')
      router.push(`/jobs/${data.id}`)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/jobs" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="title" required>Job Title</Label>
          <Input id="title" name="title" placeholder="Install new shingles - front slope" required autoFocus />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InlineCustomerSelect defaultValue={prefillCustomerId ?? ''} required />
          <InlineProjectSelect defaultValue={prefillProjectId ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select id="priority" name="priority" options={PRIORITY_OPTIONS} defaultValue="normal" />
        </div>

        {/* Schedule */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Schedule</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="scheduled_date">Date</Label>
              <Input id="scheduled_date" name="scheduled_date" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <TimeSelect value={jobStartTime} onChange={handleJobStartChange} />
              <input type="hidden" name="scheduled_time" value={jobStartTime} />
            </div>
            <div className="space-y-1.5">
              <Label>End Time</Label>
              <TimeSelect value={jobEndTime} onChange={setJobEndTime} />
              <input type="hidden" name="scheduled_end_time" value={jobEndTime} />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Location</h3>
          <div className="space-y-1.5">
            <Label htmlFor="address_line1">Street Address</Label>
            <Input id="address_line1" name="address_line1" placeholder="123 Main St" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" placeholder="Denver" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" placeholder="CO" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" name="zip" placeholder="80202" />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <Label htmlFor="instructions">Instructions for Crew</Label>
          <Textarea id="instructions" name="instructions" placeholder="Gate code, parking info, special instructions..." />
        </div>

        {/* Customer Notification */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Customer will automatically receive a booking confirmation email.</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="notify_sms" value="true" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Also send text message</span>
          </label>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Link href="/jobs"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Job'}
          </Button>
        </div>
      </form>
    </div>
  )
}
