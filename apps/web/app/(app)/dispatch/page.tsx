'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Phone, UserPlus, Briefcase, MapPin, Clock, Loader2, CheckCircle, Search, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { DEFAULT_LEAD_SOURCES } from '@/lib/constants/lead-sources'
import { TeamAvailability } from '@/components/dispatch/team-availability'

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
]

export default function DispatchPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<any>(null)

  // Customer
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing')
  const [customers, setCustomers] = useState<any[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', phone: '', email: '', company_name: '', source: '' })

  // Team
  const [team, setTeam] = useState<any[]>([])
  const [assignedTo, setAssignedTo] = useState('')

  // Job
  const [title, setTitle] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [priority, setPriority] = useState('normal')
  const [instructions, setInstructions] = useState('')
  const [leadSource, setLeadSource] = useState('')

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => setCustomers(d.data ?? []))
    // Fetch team members for assignment
    fetch('/api/team').then(r => r.json()).then(d => setTeam(d.data ?? [])).catch(() => {})
  }, [])

  const filteredCustomers = customers.filter(c => {
    const name = (c.company_name ?? `${c.first_name} ${c.last_name}`).toLowerCase()
    return name.includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch) || c.email?.toLowerCase().includes(customerSearch.toLowerCase())
  })

  const handleSubmit = async () => {
    if (!title) { toast.error('Job title is required'); return }

    // Require customer
    if (customerMode === 'existing' && !selectedCustomerId) {
      toast.error('Please select a customer')
      return
    }
    if (customerMode === 'new' && !newCustomer.first_name && !newCustomer.company_name) {
      toast.error('Please enter customer name or company')
      return
    }

    setLoading(true)

    let customerId = selectedCustomerId

    // Create new customer if needed
    if (customerMode === 'new' && (newCustomer.first_name || newCustomer.company_name)) {
      const custRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCustomer, source: newCustomer.source || leadSource || undefined }),
      })
      if (custRes.ok) {
        const { data } = await custRes.json()
        customerId = data.id
      } else {
        toast.error('Failed to create customer')
        setLoading(false)
        return
      }
    }

    // Update existing customer's source if provided and they don't have one
    if (customerMode === 'existing' && customerId && leadSource) {
      await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: leadSource }),
      }).catch(() => {}) // Non-blocking
    }

    // Build job data
    const jobData: any = {
      title,
      priority,
      customer_id: customerId || undefined,
      address_line1: address || undefined,
      city: city || undefined,
      state: state || undefined,
      zip: zip || undefined,
      instructions: instructions || undefined,
    }

    if (date && startTime) {
      jobData.scheduled_start = `${date}T${startTime}:00`
    }
    if (date && endTime) {
      jobData.scheduled_end = `${date}T${endTime}:00`
    }

    // Create job
    const jobRes = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData),
    })

    if (!jobRes.ok) {
      const { error } = await jobRes.json()
      toast.error(error ?? 'Failed to create job')
      setLoading(false)
      return
    }

    const { data: job } = await jobRes.json()

    // Assign employee if selected
    let assignResult = null
    if (assignedTo) {
      const assignRes = await fetch(`/api/jobs/${job.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: assignedTo }),
      })
      if (assignRes.ok) {
        assignResult = await assignRes.json()
      }
    }

    setSuccess({ job, assignResult })
    toast.success('Job dispatched!')
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Job Dispatched</h2>
          <p className="text-sm text-gray-600 mt-1">{success.job.job_number} — {success.job.title}</p>
          {success.assignResult && (
            <p className="text-sm text-green-700 mt-2">{success.assignResult.message}</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push(`/jobs/${success.job.id}`)}>View Job</Button>
          <Button variant="outline" onClick={() => { setSuccess(null); setTitle(''); setAddress(''); setCity(''); setState(''); setZip(''); setDate(''); setStartTime(''); setEndTime(''); setInstructions(''); setSelectedCustomerId(''); setAssignedTo(''); setLeadSource('') }}>
            Dispatch Another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quick Dispatch</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create a job and assign it in one step — customer gets notified automatically</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Customer */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-600" /> Customer
          </h2>

          <div className="flex gap-2">
            <button
              onClick={() => setCustomerMode('existing')}
              className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${customerMode === 'existing' ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              Existing
            </button>
            <button
              onClick={() => setCustomerMode('new')}
              className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${customerMode === 'new' ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              <UserPlus className="w-3.5 h-3.5 inline mr-1" /> New
            </button>
          </div>

          {customerMode === 'existing' ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search by name, phone, or email..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {filteredCustomers.slice(0, 8).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedCustomerId === c.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}
                  >
                    <p className="font-medium text-gray-900">{c.company_name ?? `${c.first_name} ${c.last_name}`}</p>
                    <p className="text-xs text-gray-500">{c.phone} {c.email ? `— ${c.email}` : ''}</p>
                  </button>
                ))}
                {filteredCustomers.length === 0 && (
                  <p className="px-3 py-4 text-sm text-gray-400 text-center">No matching customers — try "New"</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>First Name</Label><Input value={newCustomer.first_name} onChange={e => setNewCustomer(p => ({ ...p, first_name: e.target.value }))} placeholder="John" /></div>
                <div><Label>Last Name</Label><Input value={newCustomer.last_name} onChange={e => setNewCustomer(p => ({ ...p, last_name: e.target.value }))} placeholder="Smith" /></div>
              </div>
              <div><Label>Phone</Label><Input value={newCustomer.phone} onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 123-4567" type="tel" /></div>
              <div><Label>Email</Label><Input value={newCustomer.email} onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))} placeholder="john@email.com" type="email" /></div>
              <div><Label>Company (optional)</Label><Input value={newCustomer.company_name} onChange={e => setNewCustomer(p => ({ ...p, company_name: e.target.value }))} placeholder="Smith Properties" /></div>
              <div>
                <Label className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Lead Source</Label>
                <Select value={newCustomer.source} onChange={e => setNewCustomer(p => ({ ...p, source: e.target.value }))} placeholder="Where did this lead come from?" options={DEFAULT_LEAD_SOURCES} />
              </div>
            </div>
          )}
        </div>

        {/* Right: Job Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" /> Job Details
          </h2>

          <div><Label required>Job Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Roof inspection, Gutter repair, etc." autoFocus /></div>

          <div><Label>Priority</Label><Select value={priority} onChange={e => setPriority(e.target.value)} options={PRIORITY_OPTIONS} /></div>

          <div>
            <Label className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Lead Source</Label>
            <Select value={leadSource} onChange={e => setLeadSource(e.target.value)} placeholder="Where did this lead come from?" options={DEFAULT_LEAD_SOURCES} />
          </div>

          {/* Address */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <Label className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Address</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" />
            <div className="grid grid-cols-3 gap-2">
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
              <Input value={state} onChange={e => setState(e.target.value)} placeholder="State" />
              <Input value={zip} onChange={e => setZip(e.target.value)} placeholder="ZIP" />
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <Label className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Schedule</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} placeholder="Start" />
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} placeholder="End" />
            </div>
          </div>

          {/* Assign */}
          {team.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <Label>Assign To</Label>
              <Select
                value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
                placeholder="Select team member..."
                options={team.map((t: any) => ({ label: `${t.first_name} ${t.last_name}`, value: t.id }))}
              />
            </div>
          )}

          <div><Label>Crew Instructions</Label><Textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Gate code, parking info, special notes..." /></div>
        </div>
      </div>

      {/* Team Availability */}
      <TeamAvailability
        selectedMemberId={assignedTo}
        selectedDate={date}
        onSelectSlot={(memberId, slotDate) => {
          setAssignedTo(memberId)
          setDate(slotDate)
        }}
      />

      {/* Submit */}
      <Button onClick={handleSubmit} disabled={loading} className="w-full py-3" size="lg">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Briefcase className="w-4 h-4 mr-2" />}
        Dispatch Job
      </Button>
    </div>
  )
}
