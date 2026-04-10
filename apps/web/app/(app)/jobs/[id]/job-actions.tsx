'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Navigation, CheckCircle, Play, MessageSquare, Trash2,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  jobId: string
  status: string
  isOwner: boolean
  customerId?: string
  customerName?: string
}

export function JobActions({ jobId, status, isOwner, customerId, customerName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const updateStatus = async (newStatus: string) => {
    setLoading(newStatus)
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const data = await res.json()
      toast.success(`Status updated to ${newStatus.replace(/_/g, ' ')}${data.sms_sent ? ' — customer notified' : ''}`)
      router.refresh()
    } else {
      toast.error('Failed to update')
    }
    setLoading(null)
  }

  const notifyCustomer = async (type: string) => {
    setLoading('sms')
    const res = await fetch(`/api/jobs/${jobId}/notify-customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    })
    if (res.ok) {
      toast.success('Customer notified')
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to send SMS')
    }
    setLoading(null)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this job? This cannot be undone.')) return
    const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Job deleted')
      window.location.href = '/jobs'
    } else {
      toast.error('Failed to delete job')
    }
  }

  const invoiceParams = new URLSearchParams()
  invoiceParams.set('job_id', jobId)
  if (customerId) invoiceParams.set('customer_id', customerId)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Actions</h2>
      <div className="flex flex-col gap-2">
        {/* Status transitions */}
        {status === 'unscheduled' && (
          <Button size="sm" className="w-full justify-start" onClick={() => updateStatus('scheduled')} disabled={!!loading}>
            <Play className="w-4 h-4 mr-2" /> Mark Scheduled
          </Button>
        )}
        {status === 'scheduled' && (
          <Button size="sm" className="w-full justify-start" onClick={() => updateStatus('en_route')} disabled={!!loading}>
            <Navigation className="w-4 h-4 mr-2" /> On the Way
          </Button>
        )}
        {status === 'en_route' && (
          <Button size="sm" className="w-full justify-start" onClick={() => updateStatus('on_site')} disabled={!!loading}>
            <Play className="w-4 h-4 mr-2" /> On Site
          </Button>
        )}
        {(status === 'on_site' || status === 'in_progress') && (
          <Button size="sm" className="w-full justify-start" onClick={() => updateStatus('completed')} disabled={!!loading}>
            <CheckCircle className="w-4 h-4 mr-2" /> Complete
          </Button>
        )}
        {status === 'scheduled' && (
          <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => updateStatus('in_progress')} disabled={!!loading}>
            <Play className="w-4 h-4 mr-2" /> Start Work
          </Button>
        )}

        {/* Create Invoice */}
        <Link href={`/invoices/new?${invoiceParams.toString()}`} className="w-full">
          <Button size="sm" variant="outline" className="w-full justify-start">
            <FileText className="w-4 h-4 mr-2" /> Create Invoice
          </Button>
        </Link>

        {/* Manual customer SMS */}
        <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => notifyCustomer('on_the_way')} disabled={loading === 'sms'}>
          <MessageSquare className="w-4 h-4 mr-2" /> Text Customer
        </Button>

        {/* Owner-only delete */}
        {isOwner && (
          <Button size="sm" variant="destructive" className="w-full justify-start" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        )}
      </div>
    </div>
  )
}
