'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { DEFAULT_LEAD_SOURCES as SOURCE_OPTIONS } from '@/lib/constants/lead-sources'

export default function NewLeadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => setCustomers(d.data ?? []))
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const fd = new FormData(e.currentTarget)
      const body: Record<string, any> = {}
      fd.forEach((v, k) => {
        if (v === '') return
        if (k === 'estimated_value') body[k] = Number(v)
        else body[k] = v
      })

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error ?? 'Failed to create lead')
        return
      }

      toast.success('Lead created')
      router.push('/leads')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/leads" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Lead</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="title" required>Lead Title</Label>
          <Input id="title" name="title" placeholder="Roof replacement for 123 Main St" required autoFocus />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="customer_id">Customer</Label>
          <Select
            id="customer_id"
            name="customer_id"
            placeholder="Select or leave blank..."
            defaultValue=""
            options={customers.map((c: any) => ({
              label: c.company_name ?? `${c.first_name} ${c.last_name}`,
              value: c.id,
            }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="Notes about this lead..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="estimated_value">Estimated Value ($)</Label>
            <Input id="estimated_value" name="estimated_value" type="number" step="0.01" placeholder="0.00" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="source">Source</Label>
            <Select id="source" name="source" placeholder="How did they find you?" defaultValue="" options={SOURCE_OPTIONS} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="follow_up_date">Follow-up Date</Label>
          <Input id="follow_up_date" name="follow_up_date" type="date" />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Link href="/leads"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Lead'}
          </Button>
        </div>
      </form>
    </div>
  )
}
