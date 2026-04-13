'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, X, FileText, Clock, CheckCircle2, XCircle, Eye } from 'lucide-react'
import { usePortalSession } from '../../../layout'
import { toast } from 'sonner'

interface ChangeRequest {
  id: string
  title: string
  description: string | null
  status: string
  review_notes: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by_user?: { first_name: string; last_name: string } | null
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  pending: { label: 'Pending', bg: 'bg-yellow-50', text: 'text-yellow-700', icon: Clock },
  in_review: { label: 'In Review', bg: 'bg-blue-50', text: 'text-blue-700', icon: Eye },
  approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
}

export default function PortalChangeRequestsPage({ params }: { params: { id: string } }) {
  const { session } = usePortalSession()
  const [requests, setRequests] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

  useEffect(() => {
    if (session) fetchRequests()
  }, [session])

  async function fetchRequests() {
    try {
      const res = await fetch(`/api/portal/change-requests?project_id=${params.id}`)
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setRequests(json.data || [])
    } catch {
      toast.error('Failed to load change requests')
    } finally {
      setLoading(false)
    }
  }

  async function submitRequest() {
    if (!title.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/portal/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), project_id: params.id }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      toast.success('Change request submitted')
      setTitle('')
      setDescription('')
      setShowForm(false)
      await fetchRequests()
    } catch {
      toast.error('Failed to submit change request')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateRequest(id: string) {
    if (!editTitle.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/portal/change-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim(), description: editDescription.trim() }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success('Change request updated')
      setEditingId(null)
      await fetchRequests()
    } catch {
      toast.error('Failed to update change request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/public/portal/projects/${params.id}`} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Change Requests</h1>
            <p className="text-sm text-gray-500">Submit and track change requests</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Submit Request'}
        </button>
      </div>

      {/* New Request Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">New Change Request</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Brief description of the change..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide more details about the requested change..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={submitRequest}
              disabled={submitting || !title.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      )}

      {/* Change Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No change requests yet</p>
          <p className="text-sm text-gray-400 mt-1">Submit a change request to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((cr) => {
            const status = STATUS_CONFIG[cr.status] || STATUS_CONFIG.pending
            const StatusIcon = status.icon
            const isEditing = editingId === cr.id

            return (
              <div key={cr.id} className="bg-white rounded-lg border border-gray-200 p-5">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <textarea
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                      <button
                        onClick={() => updateRequest(cr.id)}
                        disabled={submitting || !editTitle.trim()}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">{cr.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                        {cr.status === 'pending' && (
                          <button
                            onClick={() => { setEditingId(cr.id); setEditTitle(cr.title); setEditDescription(cr.description || '') }}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                    {cr.description && (
                      <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{cr.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>Submitted {new Date(cr.created_at).toLocaleDateString()}</span>
                      {cr.reviewed_at && cr.reviewed_by_user && (
                        <span>
                          Reviewed by {cr.reviewed_by_user.first_name} {cr.reviewed_by_user.last_name} on {new Date(cr.reviewed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {cr.review_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-1">Review Notes</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{cr.review_notes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
