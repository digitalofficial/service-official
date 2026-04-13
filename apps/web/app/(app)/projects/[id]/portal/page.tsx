'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, FileText, Clock, CheckCircle2, XCircle, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  body: string
  direction: string
  created_at: string
  portal_user?: { id: string; email: string; company_name?: string; role?: string } | null
  staff_user?: { id: string; first_name: string; last_name: string } | null
}

interface ChangeRequest {
  id: string
  title: string
  description: string | null
  status: string
  review_notes: string | null
  created_at: string
  reviewed_at: string | null
  submitted_by_user?: { id: string; email: string; company_name?: string; role?: string } | null
  reviewed_by_user?: { first_name: string; last_name: string } | null
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  pending: { label: 'Pending', bg: 'bg-yellow-50', text: 'text-yellow-700', icon: Clock },
  in_review: { label: 'In Review', bg: 'bg-blue-50', text: 'text-blue-700', icon: Eye },
  approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
}

export default function ProjectPortalPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'messages' | 'changes'>('messages')
  const [messages, setMessages] = useState<Message[]>([])
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([])
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [loadingChanges, setLoadingChanges] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewStatus, setReviewStatus] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    fetchChangeRequests()
  }, [params.id])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/projects/${params.id}/messages`)
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setMessages(json.data || [])
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  async function fetchChangeRequests() {
    try {
      const res = await fetch(`/api/projects/${params.id}/change-requests`)
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setChangeRequests(json.data || [])
    } catch {
      toast.error('Failed to load change requests')
    } finally {
      setLoadingChanges(false)
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/projects/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setNewMessage('')
      await fetchMessages()
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  async function submitReview(changeRequestId: string) {
    if (!reviewStatus) return
    setReviewing(true)
    try {
      const res = await fetch(`/api/projects/${params.id}/change-requests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          change_request_id: changeRequestId,
          status: reviewStatus,
          review_notes: reviewNotes.trim(),
        }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success('Change request updated')
      setReviewingId(null)
      setReviewStatus('')
      setReviewNotes('')
      await fetchChangeRequests()
    } catch {
      toast.error('Failed to update change request')
    } finally {
      setReviewing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Client Portal</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === 'messages' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Messages
          {messages.length > 0 && <span className="text-xs bg-gray-200 rounded-full px-1.5">{messages.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('changes')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === 'changes' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Change Requests
          {changeRequests.length > 0 && <span className="text-xs bg-gray-200 rounded-full px-1.5">{changeRequests.length}</span>}
        </button>
      </div>

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ height: '500px' }}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No portal messages yet.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isStaff = msg.direction === 'staff_to_client'
                const senderName = isStaff
                  ? msg.staff_user
                    ? `${msg.staff_user.first_name} ${msg.staff_user.last_name}`
                    : 'You'
                  : msg.portal_user?.email || 'Client'
                const roleBadge = !isStaff && msg.portal_user?.role
                  ? msg.portal_user.role.charAt(0).toUpperCase() + msg.portal_user.role.slice(1)
                  : null

                return (
                  <div key={msg.id} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-lg px-4 py-2.5 ${
                      isStaff ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className={`text-xs font-medium mb-1 ${isStaff ? 'text-blue-200' : 'text-gray-500'}`}>
                        {senderName}
                        {roleBadge && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-gray-200 text-gray-600">{roleBadge}</span>
                        )}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                      <p className={`text-xs mt-1.5 ${isStaff ? 'text-blue-200' : 'text-gray-400'}`}>
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
                placeholder="Reply to client..."
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
      )}

      {/* Change Requests Tab */}
      {activeTab === 'changes' && (
        <div>
          {loadingChanges ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : changeRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No change requests</p>
              <p className="text-sm text-gray-400 mt-1">Client change requests will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {changeRequests.map((cr) => {
                const status = STATUS_CONFIG[cr.status] || STATUS_CONFIG.pending
                const StatusIcon = status.icon
                const isReviewing = reviewingId === cr.id

                return (
                  <div key={cr.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{cr.title}</h3>
                        {cr.submitted_by_user && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            From: {cr.submitted_by_user.email}
                            {cr.submitted_by_user.company_name && ` (${cr.submitted_by_user.company_name})`}
                            {cr.submitted_by_user.role && (
                              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 capitalize">
                                {cr.submitted_by_user.role}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    {cr.description && (
                      <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{cr.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mb-3">
                      Submitted {new Date(cr.created_at).toLocaleDateString()}
                    </p>

                    {cr.review_notes && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 mb-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Review Notes</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{cr.review_notes}</p>
                        {cr.reviewed_by_user && (
                          <p className="text-xs text-gray-400 mt-1">
                            - {cr.reviewed_by_user.first_name} {cr.reviewed_by_user.last_name}, {cr.reviewed_at && new Date(cr.reviewed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Review Actions */}
                    {isReviewing ? (
                      <div className="border-t border-gray-100 pt-3 space-y-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setReviewStatus('approved')}
                            className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                              reviewStatus === 'approved'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setReviewStatus('rejected')}
                            className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                              reviewStatus === 'rejected'
                                ? 'bg-red-50 border-red-300 text-red-700'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => setReviewStatus('in_review')}
                            className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                              reviewStatus === 'in_review'
                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            In Review
                          </button>
                        </div>
                        <textarea
                          value={reviewNotes}
                          onChange={e => setReviewNotes(e.target.value)}
                          placeholder="Add review notes (optional)..."
                          rows={2}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setReviewingId(null); setReviewStatus(''); setReviewNotes('') }}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => submitReview(cr.id)}
                            disabled={reviewing || !reviewStatus}
                            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {reviewing ? 'Saving...' : 'Submit Review'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setReviewingId(cr.id); setReviewStatus(''); setReviewNotes('') }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Review
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
