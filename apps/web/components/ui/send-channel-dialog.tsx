'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Mail, Phone, Loader2 } from 'lucide-react'

export type SendChannel = 'email' | 'sms' | 'both'

interface SendChannelDialogProps {
  onSend: (channel: SendChannel) => Promise<void>
  hasEmail: boolean
  hasPhone: boolean
  label?: string
  disabled?: boolean
}

/**
 * Inline channel picker that replaces a single "Send" button.
 * Shows available channels based on customer contact info.
 */
export function SendChannelDialog({
  onSend,
  hasEmail,
  hasPhone,
  label = 'Send',
  disabled = false,
}: SendChannelDialogProps) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [activeChannel, setActiveChannel] = useState<SendChannel | null>(null)

  const handleSend = async (channel: SendChannel) => {
    setSending(true)
    setActiveChannel(channel)
    try {
      await onSend(channel)
    } finally {
      setSending(false)
      setActiveChannel(null)
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)} disabled={disabled || sending}>
        <Send className="w-4 h-4 mr-1" /> {label}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
      <span className="text-xs font-medium text-gray-500 mr-1">Send via:</span>

      {hasEmail && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSend('email')}
          disabled={sending}
          className="h-7 text-xs gap-1"
        >
          {sending && activeChannel === 'email' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Mail className="w-3 h-3" />
          )}
          Email
        </Button>
      )}

      {hasPhone && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleSend('sms')}
          disabled={sending}
          className="h-7 text-xs gap-1"
        >
          {sending && activeChannel === 'sms' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Phone className="w-3 h-3" />
          )}
          Text
        </Button>
      )}

      {hasEmail && hasPhone && (
        <Button
          size="sm"
          onClick={() => handleSend('both')}
          disabled={sending}
          className="h-7 text-xs gap-1"
        >
          {sending && activeChannel === 'both' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Send className="w-3 h-3" />
          )}
          Both
        </Button>
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={() => setOpen(false)}
        disabled={sending}
        className="h-7 text-xs text-gray-400"
      >
        Cancel
      </Button>
    </div>
  )
}
