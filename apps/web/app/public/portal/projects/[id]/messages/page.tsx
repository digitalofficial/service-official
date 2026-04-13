'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, MessageSquare } from 'lucide-react'
import { usePortalSession } from '../../../layout'
import { toast } from 'sonner'

interface Message {
  id: string
  body: string
  direction: string
  created_at: string
  portal_user?: { id: string; email: string } | null
  staff_user?: { id: string; first_name: string; last_name: string } | null
}

export default function PortalMessagesPage({ params }: { params: { id: string } }) {
  const { session, permissions } = usePortalSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session) fetchMessages()
  }, [session])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/portal/messages?project_id=${params.id}`)
      if (!res.ok) throw new Error('Failed to load messages')
      const json = await res.json()
      setMessages(json.data || [])
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/portal/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim(), project_id: params.id }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      setNewMessage('')
      await fetchMessages()
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (!permissions.send_messages) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">You do not have permission to view messages.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/public/portal/projects/${params.id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500">Project communication</p>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="bg-white rounded-lg border border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No messages yet. Start the conversation below.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isClient = msg.direction === 'client_to_staff'
              const senderName = isClient
                ? 'You'
                : msg.staff_user
                  ? `${msg.staff_user.first_name} ${msg.staff_user.last_name}`
                  : 'Contractor'

              return (
                <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-lg px-4 py-2.5 ${
                    isClient
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {!isClient && (
                      <p className={`text-xs font-medium mb-1 ${isClient ? 'text-blue-200' : 'text-gray-500'}`}>
                        {senderName}
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-gray-200 text-gray-600">Contractor</span>
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                    <p className={`text-xs mt-1.5 ${isClient ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Compose */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
