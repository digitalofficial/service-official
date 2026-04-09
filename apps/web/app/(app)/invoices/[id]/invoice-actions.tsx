'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SendChannelDialog, type SendChannel } from '@/components/ui/send-channel-dialog'
import { Printer, Copy, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface InvoiceActionsProps {
  invoiceId: string
  status: string
  hasEmail: boolean
  hasPhone: boolean
}

export function InvoiceActions({ invoiceId, status, hasEmail, hasPhone }: InvoiceActionsProps) {
  const router = useRouter()

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/public/invoice/${invoiceId}`
    navigator.clipboard.writeText(url)
    toast.success('Invoice link copied — share with customer')
  }

  const handleSend = async (channel: SendChannel) => {
    const res = await fetch(`/api/invoices/${invoiceId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel }),
    })
    if (res.ok) {
      const channelLabel = channel === 'both' ? 'email & text' : channel === 'sms' ? 'text' : 'email'
      toast.success(`Invoice sent via ${channelLabel}`)
      router.refresh()
    } else {
      toast.error('Failed to send invoice')
    }
  }

  const handleMarkPaid = async () => {
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid', paid_at: new Date().toISOString(), amount_paid: 0, amount_due: 0 }),
    })
    if (res.ok) {
      toast.success('Invoice marked as paid')
      router.refresh()
    }
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
        <SendChannelDialog
          onSend={handleSend}
          hasEmail={hasEmail}
          hasPhone={hasPhone}
          label="Send Invoice"
        />
      )}
      {status !== 'paid' && status !== 'voided' && (
        <Button variant="secondary" size="sm" onClick={handleMarkPaid}>
          <CheckCircle className="w-4 h-4 mr-1" /> Mark Paid
        </Button>
      )}
    </div>
  )
}
