'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle2, Clock, Image as ImageIcon,
  FileText, MessageSquare, Send, MapPin, Calendar
} from 'lucide-react'

export default function PortalProjectDetailPage({ params }: { params: { id: string } }) {
  const id = params.id
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'files' | 'messages'>('overview')
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { fetchProject() }, [id])

  async function fetchProject() {
    const res = await fetch(`/api/portal/projects/${id}`)
    if (!res.ok) { router.push('/public/portal/dashboard'); return }
    const json = await res.json()
    setData(json.data)
    setLoading(false)
  }

  async function sendMessage() {
    if (!newMessage.trim()) return
    setSending(true)
    const res = await fetch(`/api/portal/projects/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: newMessage }),
    })
    if (res.ok) {
      setNewMessage('')
      fetchProject()
    }
    setSending(false)
  }

  if (loading) return <div className="animate-pulse space-y-6"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-64 bg-gray-100 rounded-lg" /></div>
  if (!data) return null

  const { project, phases, milestones, photos, files, messages, progress_percent, permissions: perms } = data
  const PHASE_ICONS: Record<string, typeof CheckCircle2> = { completed: CheckCircle2, in_progress: Clock }

  const visibleTabs = ['overview' as const,
    ...(perms?.view_photos !== false ? ['photos' as const] : []),
    ...(perms?.view_files !== false ? ['files' as const] : []),
    ...(perms?.send_messages !== false ? ['messages' as const] : []),
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/public/portal/dashboard" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-sm text-gray-500 capitalize">{project.status.replace(/_/g, ' ')}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-900">Project Progress</span>
          <span className="text-lg font-bold text-blue-600">{progress_percent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="h-3 rounded-full bg-blue-600 transition-all" style={{ width: `${progress_percent}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
        {visibleTabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-sm rounded-md capitalize transition-colors flex items-center gap-1.5 ${activeTab === tab ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
            {tab === 'photos' && <ImageIcon className="w-3.5 h-3.5" />}
            {tab === 'files' && <FileText className="w-3.5 h-3.5" />}
            {tab === 'messages' && <MessageSquare className="w-3.5 h-3.5" />}
            {tab}
            {tab === 'photos' && photos.length > 0 && <span className="text-xs bg-gray-200 rounded-full px-1.5">{photos.length}</span>}
            {tab === 'messages' && messages.length > 0 && <span className="text-xs bg-gray-200 rounded-full px-1.5">{messages.length}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {project.description && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-600">{project.description}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="flex gap-4 text-sm text-gray-500 mb-6">
              {project.estimated_start_date && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Start: {project.estimated_start_date}</span>}
              {project.estimated_end_date && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />End: {project.estimated_end_date}</span>}
            </div>

            {/* Phases */}
            {phases.length > 0 && (
              <div className="space-y-3">
                {phases.map((phase: any, i: number) => (
                  <div key={phase.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      phase.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                      phase.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {phase.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${phase.status === 'completed' ? 'text-emerald-700' : 'text-gray-900'}`}>{phase.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{phase.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Milestones */}
          {milestones.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Milestones</h3>
              <div className="space-y-2">
                {milestones.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span className={m.status === 'completed' ? 'text-emerald-700 line-through' : 'text-gray-900'}>{m.name}</span>
                    <span className="text-gray-400">{m.due_date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'photos' && (
        <div>
          {photos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No photos shared yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos.map((photo: any) => (
                <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative group">
                  <img src={photo.public_url || photo.thumbnail_url} alt={photo.caption || ''} className="w-full h-full object-cover" />
                  {(photo.is_before || photo.is_after) && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded-full">
                      {photo.is_before ? 'Before' : 'After'}
                    </span>
                  )}
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'files' && (
        <div>
          {files.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No documents shared yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 divide-y">
              {files.map((file: any) => (
                <a key={file.id} href={file.public_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 hover:bg-gray-50">
                  <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{file.file_type} {file.size_bytes ? `— ${(file.size_bytes / 1024).toFixed(0)}KB` : ''}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-4">
          {/* Message Thread */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4 max-h-[400px] overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No messages yet. Send a message below.</p>
            ) : (
              [...messages].reverse().map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.direction === 'client_to_staff' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-lg px-4 py-2.5 ${
                    msg.direction === 'client_to_staff'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{msg.body}</p>
                    <p className={`text-xs mt-1 ${msg.direction === 'client_to_staff' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Compose */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      )}
    </div>
  )
}
