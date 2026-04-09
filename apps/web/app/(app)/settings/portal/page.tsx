'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save } from 'lucide-react'

const PERMISSION_LABELS: Record<string, { label: string; description: string }> = {
  view_invoices: { label: 'View Invoices', description: 'Customers can see their invoices in the portal' },
  view_estimates: { label: 'View Estimates', description: 'Customers can see their estimates in the portal' },
  view_projects: { label: 'View Projects', description: 'Customers can view project details and progress' },
  view_payment_history: { label: 'View Payment History', description: 'Customers can see past payment records' },
  pay_invoices: { label: 'Pay Invoices', description: 'Customers can pay invoices online via Stripe' },
  send_messages: { label: 'Send Messages', description: 'Customers can message your team from the portal' },
  view_photos: { label: 'View Photos', description: 'Customers can see project photos' },
  view_files: { label: 'View Files', description: 'Customers can view and download shared documents' },
}

export default function PortalSettingsPage() {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings/portal')
      .then(r => r.json())
      .then(d => { setPermissions(d.permissions); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const res = await fetch('/api/settings/portal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions }),
    })
    if (res.ok) {
      const data = await res.json()
      setPermissions(data.permissions)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Customer Portal</h2>
        <p className="text-sm text-gray-500 mt-0.5">Control what your customers can access in their portal.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        {Object.entries(PERMISSION_LABELS).map(([key, { label, description }]) => (
          <div key={key} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={permissions[key] ?? true}
              onClick={() => setPermissions(p => ({ ...p, [key]: !(p[key] ?? true) }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                (permissions[key] ?? true) ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                  (permissions[key] ?? true) ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && <span className="text-sm text-emerald-600">Saved!</span>}
      </div>
    </div>
  )
}
