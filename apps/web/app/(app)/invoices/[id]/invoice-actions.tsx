'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Printer, Send, Copy, Download, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface InvoiceActionsProps {
  invoiceId: string
  status: string
}

export function InvoiceActions({ invoiceId, status }: InvoiceActionsProps) {
  const router = useRouter()
  const [sending, setSending] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/public/invoice/${invoiceId}`
    navigator.clipboard.writeText(url)
    toast.success('Invoice link copied — share with customer')
  }

  const handleSend = async () => {
    setSending(true)
    const res = await fetch(`/api/invoices/${invoiceId}/send`, { method: 'POST' })
    if (res.ok) {
      toast.success('Invoice sent to customer')
      router.refresh()
    } else {
      toast.error('Failed to send invoice')
    }
    setSending(false)
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
        <Button size="sm" onClick={handleSend} disabled={sending}>
          <Send className="w-4 h-4 mr-1" /> {sending ? 'Sending...' : 'Send Invoice'}
        </Button>
      )}
      {status !== 'paid' && status !== 'voided' && (
        <Button variant="secondary" size="sm" onClick={handleMarkPaid}>
          <CheckCircle className="w-4 h-4 mr-1" /> Mark Paid
        </Button>
      )}
    </div>
  )
}
