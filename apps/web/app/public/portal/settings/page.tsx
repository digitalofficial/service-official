'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePortalSession } from '../layout'
import { Loader2, Save, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'

export default function PortalSettingsPage() {
  const { session, loading: sessionLoading } = usePortalSession()
  const router = useRouter()

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    address_line1: '',
    city: '',
    state: '',
    zip: '',
    sms_opt_in: false,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!session) return
    fetch(`/api/portal/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get' }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.customer) {
          const c = data.customer
          setForm({
            first_name: c.first_name ?? '',
            last_name: c.last_name ?? '',
            email: c.email ?? '',
            phone: c.phone ?? '',
            company_name: c.company_name ?? '',
            address_line1: c.address_line1 ?? '',
            city: c.city ?? '',
            state: c.state ?? '',
            zip: c.zip ?? '',
            sms_opt_in: c.sms_opt_in ?? false,
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [session])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    const res = await fetch('/api/portal/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', ...form }),
    })

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data?.error || 'Failed to save. Please try again.')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)

    const res = await fetch('/api/portal/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete-account' }),
    })

    if (res.ok) {
      // Log out and redirect
      await fetch('/api/portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      })
      window.location.href = '/auth/login?tab=customer'
    } else {
      setError('Failed to delete account. Please contact support.')
      setDeleting(false)
    }
  }

  if (sessionLoading || loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* Personal Info */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">First Name</label>
              <input type="text" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Last Name</label>
              <input type="text" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">Company</label>
          <input type="text" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pt-2 border-t border-gray-100">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pt-2 border-t border-gray-100">Address</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Street Address</label>
              <input type="text" value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600">City</label>
                <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">State</label>
                <input type="text" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">ZIP</label>
                <input type="text" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* SMS Opt-in */}
        <div className="pt-2 border-t border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Text Message Notifications</h2>
          <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <input
              type="checkbox"
              checked={form.sms_opt_in}
              onChange={e => setForm(f => ({ ...f, sms_opt_in: e.target.checked }))}
              className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Receive text message updates</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Get appointment reminders, technician arrival alerts, and invoice notifications via text. Message & data rates may apply. Reply STOP to opt out anytime.
              </p>
            </div>
          </label>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {saved && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Settings saved successfully.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </form>

      {/* Delete Account */}
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-red-900">Delete Account</h2>
            <p className="text-xs text-gray-500 mt-1">
              This will permanently delete your portal account. You will lose access to all your project information, invoices, and estimates. This cannot be undone.
            </p>

            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                I want to delete my account
              </button>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-red-700 font-medium">Type DELETE to confirm:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    className="px-3 py-2 text-sm border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 w-32"
                  />
                  <button
                    onClick={handleDelete}
                    disabled={deleteConfirm !== 'DELETE' || deleting}
                    className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors flex items-center gap-2"
                  >
                    {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Delete
                  </button>
                  <button
                    onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
