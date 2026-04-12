'use client'

import { useState } from 'react'
import { Send, Users, Building2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function PushNotificationsPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [orgId, setOrgId] = useState('')
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([])
  const [orgsLoaded, setOrgsLoaded] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; sent?: number; error?: string } | null>(null)

  async function loadOrgs() {
    if (orgsLoaded) return
    try {
      const res = await fetch('/api/admin/orgs')
      if (res.ok) {
        const data = await res.json()
        setOrgs(data.data ?? [])
      }
    } catch {}
    setOrgsLoaded(true)
  }

  async function handleSend() {
    if (!title.trim() || !body.trim()) return
    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/notifications/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          organization_id: orgId || undefined,
        }),
      })
      const data = await res.json()
      setResult(data)
      if (data.success) {
        setTitle('')
        setBody('')
        setOrgId('')
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Push Notifications</h1>
        <p className="text-gray-400 text-sm mt-1">Send push notifications to all users with the mobile app</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-5 max-w-2xl">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. New Feature Available"
            maxLength={100}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Message</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="e.g. Check out the new materials tracking feature in your jobs..."
            rows={4}
            maxLength={500}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">{body.length}/500</p>
        </div>

        {/* Audience */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Audience
            </span>
          </label>
          <select
            value={orgId}
            onChange={e => setOrgId(e.target.value)}
            onFocus={loadOrgs}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All organizations</option>
            {orgs.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {orgId ? 'Only users in this organization will receive the notification' : 'Every user with push enabled will receive this'}
          </p>
        </div>

        {/* Preview */}
        {(title || body) && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Preview</p>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">SO</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{title || 'Notification title'}</p>
                  <p className="text-sm text-gray-400 mt-0.5 line-clamp-3">{body || 'Message body'}</p>
                  <p className="text-xs text-gray-600 mt-1">now</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            result.success
              ? 'bg-green-900/30 border border-green-800 text-green-300'
              : 'bg-red-900/30 border border-red-800 text-red-300'
          }`}>
            {result.success ? (
              <>
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Sent to {result.sent} user{result.sent !== 1 ? 's' : ''}</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{result.error || 'Failed to send'}</span>
              </>
            )}
          </div>
        )}

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !body.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {sending ? 'Sending...' : 'Send Push Notification'}
        </button>
      </div>

      {/* Info */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-2xl">
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          How it works
        </h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>Sends to all users who have the mobile app installed and push enabled</li>
          <li>Creates an in-app notification record for each user</li>
          <li>Users who have disabled push in their profile settings will not receive it</li>
          <li>Notifications are delivered via Expo Push API with batching (100 per request)</li>
        </ul>
      </div>
    </div>
  )
}
