'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SendChannelDialog, type SendChannel } from '@/components/ui/send-channel-dialog'
import { Printer, Copy, Receipt, Loader2, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface EstimateActionsProps {
  estimateId: string
  status: string
  hasEmail: boolean
  hasPhone: boolean
}

export function EstimateActions({ estimateId, status, hasEmail, hasPhone }: EstimateActionsProps) {
  const router = useRouter()
  const [converting, setConverting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handlePrint = () => window.print()

  const handleCopyLink = () => {
    const url = `${window.location.origin}/public/estimate/${estimateId}`
    navigator.clipboard.writeText(url)
    toast.success('Estimate link copied — share with customer')
  }

  const handleSend = async (channel: SendChannel) => {
    const res = await fetch(`/api/estimates/${estimateId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel }),
    })
    if (res.ok) {
      const channelLabel = channel === 'both' ? 'email & text' : channel === 'sms' ? 'text' : 'email'
      toast.success(`Estimate sent via ${channelLabel}`)
      router.refresh()
    } else {
      toast.error('Failed to send estimate')
    }
  }

  const handleConvertToInvoice = async () => {
    setConverting(true)
    const res = await fetch(`/api/estimates/${estimateId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ due_days: 30, type: 'standard' }),
    })
    if (res.ok) {
      const { data: invoice } = await res.json()
      toast.success(`Invoice ${invoice.invoice_number} created!`)
      router.push(`/invoices/${invoice.id}`)
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to convert')
      setConverting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/estimates/${estimateId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Estimate deleted')
        router.push('/estimates')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete estimate')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const canSend = !['converted', 'expired'].includes(status) && (hasEmail || hasPhone)
  const canConvert = ['approved', 'sent', 'viewed'].includes(status)
  const canEdit = ['draft', 'sent'].includes(status)
  const canDelete = status === 'draft'

  return (
    <div className="flex items-center gap-2 no-print flex-wrap">
      {/* Edit */}
      {canEdit && (
        <Link href={`/estimates/${estimateId}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="w-4 h-4 mr-1" /> Edit
          </Button>
        </Link>
      )}
      {/* Convert to Invoice — prominent for approved estimates */}
      {canConvert && (
        <Button size="sm" onClick={handleConvertToInvoice} disabled={converting}>
          {converting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Receipt className="w-4 h-4 mr-1" />}
          {converting ? 'Creating Invoice...' : 'Convert to Invoice'}
        </Button>
      )}
      {status === 'converted' && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" /> Converted to Invoice
        </span>
      )}
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="w-4 h-4 mr-1" /> Print / PDF
      </Button>
      <Button variant="outline" size="sm" onClick={handleCopyLink}>
        <Copy className="w-4 h-4 mr-1" /> Copy Link
      </Button>
      {canSend && (
        <SendChannelDialog
          onSend={handleSend}
          hasEmail={hasEmail}
          hasPhone={hasPhone}
          label={status === 'draft' ? 'Send Estimate' : 'Resend'}
        />
      )}
      {/* Delete */}
      {canDelete && !showDeleteConfirm && (
        <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(true)} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
          <Trash2 className="w-4 h-4 mr-1" /> Delete
        </Button>
      )}
      {showDeleteConfirm && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
          <span className="text-sm text-red-700">Are you sure? This cannot be undone.</span>
          <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete'}
          </Button>
        </div>
      )}
    </div>
  )
}
