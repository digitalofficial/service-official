'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Navigation, CheckCircle, Play, Pause, MessageSquare, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  jobId: string
  status: string
  isOwner: boolean
}

export function JobActions({ jobId, status, isOwner }: Props) {
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
      router.push('/jobs')
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Status transitions */}
      {status === 'unscheduled' && (
        <Button size="sm" onClick={() => updateStatus('scheduled')} disabled={!!loading}>
          <Play className="w-4 h-4 mr-1" /> Mark Scheduled
        </Button>
      )}
      {status === 'scheduled' && (
        <Button size="sm" onClick={() => updateStatus('en_route')} disabled={!!loading}>
          <Navigation className="w-4 h-4 mr-1" /> On the Way
        </Button>
      )}
      {status === 'en_route' && (
        <Button size="sm" onClick={() => updateStatus('on_site')} disabled={!!loading}>
          <Play className="w-4 h-4 mr-1" /> On Site
        </Button>
      )}
      {(status === 'on_site' || status === 'in_progress') && (
        <Button size="sm" onClick={() => updateStatus('completed')} disabled={!!loading}>
          <CheckCircle className="w-4 h-4 mr-1" /> Complete
        </Button>
      )}
      {status === 'scheduled' && (
        <Button size="sm" variant="outline" onClick={() => updateStatus('in_progress')} disabled={!!loading}>
          Start Work
        </Button>
      )}

      {/* Manual customer SMS */}
      <Button size="sm" variant="outline" onClick={() => notifyCustomer('on_the_way')} disabled={loading === 'sms'}>
        <MessageSquare className="w-4 h-4 mr-1" /> Text Customer
      </Button>

      {/* Owner-only delete */}
      {isOwner && (
        <Button size="sm" variant="destructive" onClick={handleDelete}>
          <Trash2 className="w-4 h-4 mr-1" /> Delete
        </Button>
      )}
    </div>
  )
}
