'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Printer, Send, Copy, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export function EstimateActions({ estimateId, status }: { estimateId: string; status: string }) {
  const router = useRouter()
  const [sending, setSending] = useState(false)

  const handlePrint = () => window.print()

  const handleCopyLink = () => {
    const url = `${window.location.origin}/public/estimate/${estimateId}`
    navigator.clipboard.writeText(url)
    toast.success('Estimate link copied — share with customer')
  }

  const handleSend = async () => {
    setSending(true)
    const res = await fetch(`/api/estimates/${estimateId}/send`, { method: 'POST' })
    if (res.ok) {
      toast.success('Estimate sent to customer')
      router.refresh()
    } else {
      toast.error('Failed to send')
    }
    setSending(false)
  }

  return (
    <div className="flex items-center gap-2 no-print">
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="w-4 h-4 mr-1" /> Print / PDF
      </Button>
      <Button variant="outline" size="sm" onClick={handleCopyLink}>
        <Copy className="w-4 h-4 mr-1" /> Copy Link
      </Button>
      {status === 'draft' && (
        <Button size="sm" onClick={handleSend} disabled={sending}>
          <Send className="w-4 h-4 mr-1" /> {sending ? 'Sending...' : 'Send Estimate'}
        </Button>
      )}
    </div>
  )
}
