'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { MessageSquare, Mail, Smartphone, Loader2 } from 'lucide-react'
import { createClient } from '@service-official/database/client'

export default function NotificationSettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [notifySms, setNotifySms] = useState(true)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifyPush, setNotifyPush] = useState(true)
  const [reminder1, setReminder1] = useState('1 day')
  const [reminder2, setReminder2] = useState('1 hour')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('notify_sms, notify_email, notify_push, reminder_pref_1, reminder_pref_2')
        .eq('id', user.id)
        .single()

      if (profile) {
        setNotifySms(profile.notify_sms ?? true)
        setNotifyEmail(profile.notify_email ?? true)
        setNotifyPush(profile.notify_push ?? true)
        setReminder1(profile.reminder_pref_1 ?? '1 day')
        setReminder2(profile.reminder_pref_2 ?? '1 hour')
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notify_sms: notifySms,
          notify_email: notifyEmail,
          notify_push: notifyPush,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      toast.success('Notification preferences saved')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-900">Notification Preferences</h2>

      {/* Channel Toggles */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Notification Channels</h3>
        <div className="space-y-4">
          <ToggleRow
            icon={<MessageSquare className="w-4 h-4 text-green-600" />}
            label="SMS notifications"
            description="Receive text message alerts for job assignments and reminders"
            checked={notifySms}
            onChange={setNotifySms}
          />
          <ToggleRow
            icon={<Mail className="w-4 h-4 text-blue-600" />}
            label="Email notifications"
            description="Receive updates and summaries via email"
            checked={notifyEmail}
            onChange={setNotifyEmail}
          />
          <ToggleRow
            icon={<Smartphone className="w-4 h-4 text-purple-600" />}
            label="Push notifications"
            description="Browser push notifications for real-time updates"
            checked={notifyPush}
            onChange={setNotifyPush}
          />
        </div>
      </div>

      {/* Reminder Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-800 font-medium mb-1">Job Reminder Schedule</p>
        <p className="text-xs text-blue-700">
          Your job reminders are set to: <strong>{formatReminder(reminder1)}</strong> and <strong>{formatReminder(reminder2)}</strong>.
          Reminder timing is managed by your admin. Contact them to adjust.
        </p>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save Preferences
        </button>
      </div>
    </div>
  )
}

function formatReminder(value: string): string {
  const map: Record<string, string> = {
    '1 day': '1 day before',
    'morning': 'morning of (8 AM)',
    '2 hours': '2 hours before',
    '1 hour': '1 hour before',
    '30 minutes': '30 min before',
    '15 minutes': '15 min before',
    '0': 'none',
  }
  return map[value] ?? value
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
        style={{ width: 44, height: 24 }}
      >
        <span
          className="absolute top-[3px] rounded-full bg-white shadow transition-transform"
          style={{ width: 18, height: 18, left: checked ? 23 : 3 }}
        />
      </button>
    </div>
  )
}
