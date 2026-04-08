'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Phone, Loader2, CheckCircle, MessageSquare } from 'lucide-react'

interface Props {
  orgId: string
  existing: any | null
  smsCount: number
}

const REMINDER_OPTIONS = [
  { label: '1 day before', value: '1 day' },
  { label: 'Morning of (8 AM)', value: 'morning' },
  { label: '2 hours before', value: '2 hours' },
  { label: '1 hour before', value: '1 hour' },
  { label: '30 min before', value: '30 minutes' },
  { label: '15 min before', value: '15 minutes' },
  { label: 'None', value: '0' },
]

export function TwilioSettings({ orgId, existing, smsCount }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [enabled, setEnabled] = useState(existing?.is_enabled ?? true)
  const [sendAssignment, setSendAssignment] = useState(existing?.send_assignment_sms ?? true)
  const [reminder1, setReminder1] = useState(existing?.default_reminder_1 ?? '1 day')
  const [reminder2, setReminder2] = useState(existing?.default_reminder_2 ?? '1 hour')
  const [notifyBooked, setNotifyBooked] = useState(existing?.notify_customer_booked ?? true)
  const [notifyEnRoute, setNotifyEnRoute] = useState(existing?.notify_customer_en_route ?? true)
  const [notifyCompleted, setNotifyCompleted] = useState(existing?.notify_customer_completed ?? false)
  const [googleMapsKey, setGoogleMapsKey] = useState(existing?.google_maps_api_key ?? '')

  const handleSave = async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/clients/${orgId}/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET ?? '',
      },
      body: JSON.stringify({
        is_enabled: enabled,
        send_assignment_sms: sendAssignment,
        default_reminder_1: reminder1,
        default_reminder_2: reminder2,
        notify_customer_booked: notifyBooked,
        notify_customer_en_route: notifyEnRoute,
        notify_customer_completed: notifyCompleted,
        google_maps_api_key: googleMapsKey || null,
      }),
    })

    if (res.ok) {
      toast.success('SMS settings saved')
      router.refresh()
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to save')
    }
    setLoading(false)
  }

  // Estimate cost at ~$0.0079/segment
  const estimatedCost = (smsCount * 0.0079).toFixed(2)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-blue-400" />
          <h2 className="font-semibold text-white">SMS Settings</h2>
        </div>
        <div className="flex items-center gap-3">
          {enabled ? (
            <span className="flex items-center gap-1 text-xs text-green-400"><CheckCircle className="w-3 h-3" /> Active</span>
          ) : (
            <span className="text-xs text-gray-500">Disabled</span>
          )}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-gray-400">SMS Sent</span>
          </div>
          <p className="text-xl font-bold text-white">{smsCount}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-400">Est. Cost</span>
          </div>
          <p className="text-xl font-bold text-white">${estimatedCost}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">~$0.0079/msg</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* SMS Toggle */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-300">SMS Enabled for this client</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="sr-only peer" />
            <div className="w-9 h-5 bg-gray-700 peer-focus:ring-2 peer-focus:ring-blue-500/40 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
          </label>
        </div>

        {/* Employee notifications */}
        <div className="pt-3 border-t border-gray-800 space-y-3">
          <p className="text-xs text-gray-500 uppercase font-semibold">Employee Notifications</p>
          <p className="text-xs text-gray-600">When a job is assigned, employees receive an SMS plus up to two reminders before the job starts. Employees can override these defaults in their own profile settings.</p>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input type="checkbox" checked={sendAssignment} onChange={(e) => setSendAssignment(e.target.checked)} className="rounded border-gray-600 bg-gray-800 text-blue-500" />
              SMS on job assignment
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">First job reminder</label>
              <select value={reminder1} onChange={(e) => setReminder1(e.target.value)} className="input text-sm">
                {REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Second job reminder</label>
              <select value={reminder2} onChange={(e) => setReminder2(e.target.value)} className="input text-sm">
                {REMINDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <p className="text-[10px] text-gray-600">Example: "1 day before" + "1 hour before" means the employee gets two SMS reminders — one the day before and one an hour before the scheduled job.</p>
        </div>

        {/* Customer notifications */}
        <div className="pt-3 border-t border-gray-800">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Customer Notifications</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input type="checkbox" checked={notifyBooked} onChange={(e) => setNotifyBooked(e.target.checked)} className="rounded border-gray-600 bg-gray-800 text-green-500" />
              Job booked
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input type="checkbox" checked={notifyEnRoute} onChange={(e) => setNotifyEnRoute(e.target.checked)} className="rounded border-gray-600 bg-gray-800 text-green-500" />
              On the way
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input type="checkbox" checked={notifyCompleted} onChange={(e) => setNotifyCompleted(e.target.checked)} className="rounded border-gray-600 bg-gray-800 text-green-500" />
              Job completed
            </label>
          </div>
        </div>

        {/* Google Maps */}
        <div className="pt-3 border-t border-gray-800">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Google Maps (Optional)</p>
          <div>
            <label className="text-xs text-gray-400 block mb-1">API Key</label>
            <input value={googleMapsKey} onChange={(e) => setGoogleMapsKey(e.target.value)} placeholder="AIzaSy..." className="input text-sm" />
            <p className="text-xs text-gray-600 mt-1">For premium maps. Leave blank to use free OpenStreetMap.</p>
          </div>
        </div>

        <button
          onClick={handleSave} disabled={loading}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
