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
import { toast } from 'sonner'

const STATUS_OPTIONS = [
  { label: 'Lead', value: 'lead' },
  { label: 'Estimating', value: 'estimating' },
  { label: 'Approved', value: 'approved' },
  { label: 'In Progress', value: 'in_progress' },
]

const INDUSTRY_OPTIONS = [
  { label: 'Roofing', value: 'roofing' },
  { label: 'General Contractor', value: 'general_contractor' },
  { label: 'Electrical', value: 'electrical' },
  { label: 'Plumbing', value: 'plumbing' },
  { label: 'HVAC', value: 'hvac' },
  { label: 'Landscaping', value: 'landscaping' },
  { label: 'Painting', value: 'painting' },
  { label: 'Flooring', value: 'flooring' },
  { label: 'Concrete', value: 'concrete' },
  { label: 'Solar', value: 'solar' },
  { label: 'Other', value: 'other' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillCustomerId = searchParams.get('customer_id')

  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => setCustomers(d.data ?? []))
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const body: Record<string, any> = {}
    fd.forEach((v, k) => {
      if (v === '') return
      if (k === 'contract_value' || k === 'roof_squares') body[k] = Number(v)
      else body[k] = v
    })

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const { error } = await res.json()
      toast.error(error ?? 'Failed to create project')
      setLoading(false)
      return
    }

    const { data } = await res.json()
    toast.success('Project created')
    router.push(`/projects/${data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Project</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Basics */}
        <div className="space-y-1.5">
          <Label htmlFor="name" required>Project Name</Label>
          <Input id="name" name="name" placeholder="Smith Residence Roof Replacement" required autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" options={STATUS_OPTIONS} defaultValue="lead" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="industry">Industry</Label>
            <Select id="industry" name="industry" options={INDUSTRY_OPTIONS} defaultValue="roofing" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="customer_id">Customer</Label>
          <Select
            id="customer_id"
            name="customer_id"
            placeholder="Select a customer..."
            defaultValue={prefillCustomerId ?? ''}
            options={customers.map((c: any) => ({
              label: c.company_name ?? `${c.first_name} ${c.last_name}`,
              value: c.id,
            }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="Project scope and details..." />
        </div>

        {/* Financials */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div className="space-y-1.5">
            <Label htmlFor="contract_value">Contract Value ($)</Label>
            <Input id="contract_value" name="contract_value" type="number" step="0.01" placeholder="0.00" />
          </div>
          <div />
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="estimated_start_date">Start Date</Label>
            <Input id="estimated_start_date" name="estimated_start_date" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estimated_end_date">End Date</Label>
            <Input id="estimated_end_date" name="estimated_end_date" type="date" />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Job Site Address</h3>
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

        {/* Roofing-specific (conditional later) */}
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Trade Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="roof_type">Roof Type</Label>
              <Input id="roof_type" name="roof_type" placeholder="Asphalt shingle, TPO, etc." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roof_squares">Roof Squares</Label>
              <Input id="roof_squares" name="roof_squares" type="number" step="0.1" placeholder="0" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="permit_number">Permit Number</Label>
            <Input id="permit_number" name="permit_number" placeholder="Optional" />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Link href="/projects"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
          </Button>
        </div>
      </form>
    </div>
  )
}
