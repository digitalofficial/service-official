'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SendChannelDialog, type SendChannel } from '@/components/ui/send-channel-dialog'
import { Printer, Copy, Send } from 'lucide-react'
import { toast } from 'sonner'

interface EstimateActionsProps {
  estimateId: string
  status: string
  hasEmail: boolean
  hasPhone: boolean
}

export function EstimateActions({ estimateId, status, hasEmail, hasPhone }: EstimateActionsProps) {
  const router = useRouter()

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

  // Show send button on all non-terminal statuses (can always re-send)
  const canSend = !['converted', 'expired'].includes(status) && (hasEmail || hasPhone)

  return (
    <div className="flex items-center gap-2 no-print">
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
          label={status === 'draft' ? 'Send Estimate' : 'Resend Estimate'}
        />
      )}
    </div>
  )
}
