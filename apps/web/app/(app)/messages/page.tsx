'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate } from '@/lib/utils'
import { MessageSquare, Search, Send, Phone, Mail, User, Plus, ArrowLeft } from 'lucide-react'

interface Conversation {
  id: string
  channel: string
  phone_number?: string
  email_address?: string
  last_message_at?: string
  customer?: { first_name?: string; last_name?: string; company_name?: string; phone?: string }
  messages?: Message[]
}

interface Message {
  id: string
  direction: 'inbound' | 'outbound'
  body: string
  sent_at: string
  status: string
  channel: string
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function fetchConversations() {
      const res = await fetch('/api/messages')
      const { data } = await res.json()
      setConversations(data ?? [])
      setLoading(false)
    }
    fetchConversations()
  }, [])

  const selectConversation = async (conv: Conversation) => {
    setSelected(conv)
    setMessages(conv.messages ?? [])
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selected) return

    setSending(true)
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: selected.id,
        body: newMessage,
        channel: selected.channel,
        to: selected.phone_number ?? selected.email_address,
      }),
    })

    if (res.ok) {
      const { data } = await res.json()
      setMessages((prev) => [...prev, data])
      setNewMessage('')
    }
    setSending(false)
  }

  const getContactName = (conv: Conversation) => {
    if (conv.customer?.company_name) return conv.customer.company_name
    if (conv.customer?.first_name) return `${conv.customer.first_name} ${conv.customer.last_name}`
    return conv.phone_number ?? conv.email_address ?? 'Unknown'
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-8rem)] -m-6">
      {/* Conversation List */}
      <div className={`w-full md:w-80 border-r border-gray-200 bg-white flex flex-col shrink-0 ${selected ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">Messages</h1>
            <Button size="icon" variant="ghost"><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">No conversations</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selected?.id === conv.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    {conv.channel === 'sms' ? <Phone className="w-4 h-4 text-gray-500" /> : <Mail className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{getContactName(conv)}</p>
                    <p className="text-xs text-gray-500 truncate">{conv.phone_number ?? conv.email_address}</p>
                  </div>
                  {conv.last_message_at && (
                    <span className="text-xs text-gray-400 shrink-0">
                      {formatDate(conv.last_message_at, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className={`flex-1 flex flex-col bg-gray-50 ${!selected ? 'hidden md:flex' : 'flex'}`}>
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<MessageSquare className="w-12 h-12" />}
              title="Select a conversation"
              description="Choose a conversation from the sidebar to start messaging."
            />
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="bg-white px-6 py-3 border-b border-gray-200 flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="md:hidden text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{getContactName(selected)}</p>
                <p className="text-xs text-gray-500">{selected.phone_number ?? selected.email_address}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                      msg.direction === 'outbound'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                    <p className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {formatDate(msg.sent_at, { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Compose */}
            <form onSubmit={sendMessage} className="bg-white border-t border-gray-200 px-6 py-3 flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
