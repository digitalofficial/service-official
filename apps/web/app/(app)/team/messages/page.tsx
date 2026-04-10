'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Users, User, Check, CheckCheck, Megaphone, MessageCircle, Circle, ArrowLeft } from 'lucide-react'

interface TeamMember {
  id: string
  first_name: string
  last_name: string
  role: string
  avatar_url?: string
  push_token?: string
}

interface TeamMessage {
  id: string
  sender_id: string
  recipient_id: string | null
  body: string
  is_read: boolean
  created_at: string
  job_id?: string
  sender?: { id: string; first_name: string; last_name: string; role: string }
  recipient?: { id: string; first_name: string; last_name: string; role: string } | null
}

export default function TeamMessagesPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [messages, setMessages] = useState<TeamMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedMember, setSelectedMember] = useState<string | null>(null) // null = broadcast view
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'inbox' | 'compose'>('inbox')
  const [broadcastRecipients, setBroadcastRecipients] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async (withUser?: string) => {
    const url = withUser ? `/api/team/messages?with=${withUser}` : '/api/team/messages'
    const res = await fetch(url)
    const data = await res.json()
    setMessages(data.data ?? [])
    setMembers(data.members ?? [])
    setUnreadCount(data.unread_count ?? 0)
    setLoading(false)
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(() => fetchMessages(selectedMember ?? undefined), 10000)
    return () => clearInterval(interval)
  }, [selectedMember])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openConversation = async (memberId: string) => {
    setSelectedMember(memberId)
    setView('inbox')
    await fetchMessages(memberId)
    // Mark as read
    await fetch('/api/team/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all: false, message_ids: messages.filter(m => !m.is_read && m.sender_id === memberId).map(m => m.id) }),
    })
  }

  const handleSend = async () => {
    if (!newMessage.trim()) return
    setSending(true)

    const recipientIds = view === 'compose' && broadcastRecipients.size > 0
      ? Array.from(broadcastRecipients)
      : selectedMember
        ? [selectedMember]
        : ['all']

    await fetch('/api/team/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient_ids: recipientIds,
        message: newMessage.trim(),
      }),
    })

    setNewMessage('')
    setSending(false)

    if (view === 'compose') {
      setBroadcastRecipients(new Set())
      setView('inbox')
      setSelectedMember(null)
    }

    await fetchMessages(selectedMember ?? undefined)
  }

  const filteredMembers = members.filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return m.first_name.toLowerCase().includes(q) || m.last_name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)
  })

  // Get last message per member for the inbox view
  const getLastMessageWith = (memberId: string) => {
    const relevantMsgs = messages.filter(m =>
      (m.sender_id === memberId || m.recipient_id === memberId) ||
      m.recipient_id === null
    )
    return relevantMsgs[0]
  }

  const getUnreadFrom = (memberId: string) => {
    return messages.filter(m => m.sender_id === memberId && !m.is_read).length
  }

  const roleLabel = (role: string) => role.replace(/_/g, ' ')

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const toggleBroadcastRecipient = (id: string) => {
    const next = new Set(broadcastRecipients)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setBroadcastRecipients(next)
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white">Team Messages</h1>
          <p className="text-slate-400 text-sm">Internal messaging — no SMS costs</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'inbox' ? 'default' : 'outline'}
            onClick={() => { setView('inbox'); setSelectedMember(null); fetchMessages() }}
            size="sm"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Inbox {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
          </Button>
          <Button
            variant={view === 'compose' ? 'default' : 'outline'}
            onClick={() => { setView('compose'); setSelectedMember(null) }}
            size="sm"
          >
            <Megaphone className="w-4 h-4 mr-1" />
            Broadcast
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left: Member List */}
        <div className={`w-full md:w-80 border-r border-slate-700 flex flex-col ${selectedMember !== null ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3">
            <Input
              placeholder="Search team..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-900 border-slate-600"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Broadcast option */}
            <button
              onClick={() => { setSelectedMember(null); setView('inbox'); fetchMessages() }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-800 transition-colors ${
                selectedMember === null && view === 'inbox' ? 'bg-blue-500/10' : 'hover:bg-slate-800/50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">All Messages</p>
                <p className="text-xs text-slate-400">Broadcasts & direct</p>
              </div>
              {unreadCount > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </button>

            {filteredMembers.map(member => {
              const unread = getUnreadFrom(member.id)
              return (
                <button
                  key={member.id}
                  onClick={() => {
                    if (view === 'compose') {
                      toggleBroadcastRecipient(member.id)
                    } else {
                      openConversation(member.id)
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-800/50 transition-colors ${
                    view === 'compose' && broadcastRecipients.has(member.id)
                      ? 'bg-blue-500/10'
                      : selectedMember === member.id
                        ? 'bg-slate-800'
                        : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    view === 'compose' && broadcastRecipients.has(member.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {view === 'compose' && broadcastRecipients.has(member.id) ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      `${member.first_name[0]}${member.last_name[0]}`
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${unread > 0 ? 'text-white' : 'text-slate-300'}`}>
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">{roleLabel(member.role)}</p>
                  </div>
                  {unread > 0 && view !== 'compose' && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{unread}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Messages / Compose */}
        <div className={`flex-1 flex flex-col ${selectedMember === null && view === 'inbox' ? 'hidden md:flex' : 'flex'}`}>
          {view === 'compose' ? (
            /* Broadcast compose */
            <div className="flex-1 flex flex-col p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white mb-2">
                  {broadcastRecipients.size === 0
                    ? 'Select recipients or send to all'
                    : `Sending to ${broadcastRecipients.size} team member${broadcastRecipients.size !== 1 ? 's' : ''}`}
                </h2>
                {broadcastRecipients.size > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Array.from(broadcastRecipients).map(id => {
                      const m = members.find(m => m.id === id)
                      if (!m) return null
                      return (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded-md text-xs font-medium">
                          {m.first_name} {m.last_name}
                          <button onClick={() => toggleBroadcastRecipient(id)} className="text-blue-400 hover:text-blue-200">×</button>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="flex-1" />
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Type your message..."
                  rows={3}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={handleSend} disabled={sending || !newMessage.trim()} className="self-end bg-blue-500 hover:bg-blue-600 h-12 px-6">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* Message thread */
            <>
              <div className="md:hidden border-b border-slate-700 px-4 py-2">
                <button onClick={() => setSelectedMember(null)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <p className="text-slate-500 text-center py-20">Loading...</p>
                ) : messages.length === 0 ? (
                  <div className="text-center py-20">
                    <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No messages yet</p>
                    <p className="text-slate-500 text-sm mt-1">Send a message to get started</p>
                  </div>
                ) : (
                  [...messages].reverse().map(msg => {
                    const isMe = msg.sender_id !== (selectedMember ?? '')
                    const senderName = msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : 'Unknown'
                    const isBroadcast = msg.recipient_id === null

                    return (
                      <div key={msg.id} className={`flex ${isMe && selectedMember ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${
                          isMe && selectedMember
                            ? 'bg-blue-500 text-white rounded-2xl rounded-br-md'
                            : 'bg-slate-800 text-white rounded-2xl rounded-bl-md'
                        } px-4 py-2.5`}>
                          {(!selectedMember || isBroadcast) && (
                            <p className={`text-xs font-semibold mb-1 ${isMe && selectedMember ? 'text-blue-100' : 'text-blue-400'}`}>
                              {senderName}
                              {isBroadcast && <span className="ml-1 text-slate-400">· Broadcast</span>}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                          <p className={`text-xs mt-1 ${isMe && selectedMember ? 'text-blue-200' : 'text-slate-500'}`}>
                            {formatTime(msg.created_at)}
                            {isMe && selectedMember && msg.is_read && <span className="ml-1">✓✓</span>}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-700 p-4">
                <div className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder={selectedMember ? 'Type a message...' : 'Broadcast to all team...'}
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button onClick={handleSend} disabled={sending || !newMessage.trim()} className="bg-blue-500 hover:bg-blue-600 h-12 px-6">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
