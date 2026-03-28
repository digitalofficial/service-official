'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Loader2, CheckCircle, Phone, Bell, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const REMINDER_OPTIONS = [
  { label: '15 minutes before', value: '15_min' },
  { label: '30 minutes before', value: '30_min' },
  { label: '1 hour before', value: '1_hour' },
  { label: '2 hours before', value: '2_hours' },
  { label: '1 day before', value: '1_day' },
  { label: 'None', value: 'none' },
]

interface Props {
  orgId: string
  existing: any | null
}

export function SmsSettingsForm({ orgId, existing }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)

  const [sid, setSid] = useState(existing?.twilio_account_sid ?? '')
  const [token, setToken] = useState(existing?.twilio_auth_token ?? '')
  const [phone, setPhone] = useState(existing?.twilio_phone_number ?? '')
  const [enabled, setEnabled] = useState(existing?.is_enabled ?? false)
  const [sendAssignment, setSendAssignment] = useState(existing?.send_assignment_sms ?? true)
  const [reminder1, setReminder1] = useState(existing?.default_reminder_1 === '1 day' ? '1_day' : existing?.default_reminder_1 === '01:00:00' ? '1_hour' : '1_day')
  const [reminder2, setReminder2] = useState(existing?.default_reminder_2 === '01:00:00' ? '1_hour' : existing?.default_reminder_2 === '00:15:00' ? '15_min' : '1_hour')

  const handleSave = async () => {
    setLoading(true)

    const reminderMap: Record<string, string> = {
      '15_min': '15 minutes',
      '30_min': '30 minutes',
      '1_hour': '1 hour',
      '2_hours': '2 hours',
      '1_day': '1 day',
      'none': '0',
    }

    const res = await fetch('/api/settings/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        twilio_account_sid: sid,
        twilio_auth_token: token,
        twilio_phone_number: phone,
        is_enabled: enabled,
        send_assignment_sms: sendAssignment,
        default_reminder_1: reminderMap[reminder1],
        default_reminder_2: reminderMap[reminder2],
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

  const handleTest = async () => {
    setTesting(true)
    const res = await fetch('/api/settings/sms/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ twilio_account_sid: sid, twilio_auth_token: token, twilio_phone_number: phone }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('Test SMS sent to your phone!')
    } else {
      toast.error(data.error ?? 'Test failed — check your credentials')
    }
    setTesting(false)
  }

  return (
    <div className="space-y-6">
      {/* Twilio Credentials */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Twilio Account</h3>
          </div>
          <a
            href="https://console.twilio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            Get credentials <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sid">Account SID</Label>
          <Input id="sid" value={sid} onChange={(e) => setSid(e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="token">Auth Token</Label>
          <Input id="token" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Your Twilio auth token" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Twilio Phone Number</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+15551234567" />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Enable SMS sending
          </label>
        </div>

        {sid && token && phone && (
          <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
            Send Test SMS
          </Button>
        )}
      </div>

      {/* Reminder Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Job Reminders</h3>
        </div>

        <p className="text-xs text-gray-500">
          When an employee is assigned to a job, they'll automatically receive SMS reminders before the scheduled start time.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>First Reminder</Label>
            <Select value={reminder1} onChange={(e) => setReminder1(e.target.value)} options={REMINDER_OPTIONS} />
          </div>
          <div className="space-y-1.5">
            <Label>Second Reminder</Label>
            <Select value={reminder2} onChange={(e) => setReminder2(e.target.value)} options={REMINDER_OPTIONS} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sendAssignment} onChange={(e) => setSendAssignment(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            Send SMS immediately when employee is assigned to a job
          </label>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700 font-medium mb-1">Example reminder SMS:</p>
          <p className="text-xs text-blue-600 font-mono">
            Reminder: You have a job tomorrow at 8:00 AM{'\n'}
            "Roof Replacement - Smith Residence"{'\n'}
            📍 123 Maple Dr, Denver CO{'\n'}
            Login: https://service.yourcompany.com
          </p>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
