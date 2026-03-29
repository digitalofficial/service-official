import { createServerSupabaseClient } from '@service-official/database'
import { Badge } from '@/components/ui/badge'
import { Phone, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'SMS Settings' }

export default async function SmsSettingsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()

  const { data: settings } = await supabase
    .from('organization_sms_settings')
    .select('*')
    .eq('organization_id', profile!.organization_id)
    .single()

  const { count: smsSent } = await supabase
    .from('job_reminders')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile!.organization_id)
    .eq('status', 'sent')

  const { count: smsPending } = await supabase
    .from('job_reminders')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile!.organization_id)
    .eq('status', 'pending')

  const isActive = settings?.is_enabled && settings?.twilio_account_sid

  const reminderLabel = (val: string | null) => {
    if (!val || val === '0') return 'None'
    return val.replace('1 day', '1 day before')
      .replace('1 hour', '1 hour before')
      .replace('2 hours', '2 hours before')
      .replace('30 minutes', '30 min before')
      .replace('15 minutes', '15 min before')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">SMS & Reminders</h2>
        <p className="text-sm text-gray-500 mt-0.5">Job reminders are sent via SMS to your team members</p>
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">SMS Status</h3>
          </div>
          {isActive ? (
            <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>
          ) : (
            <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" /> Not configured</Badge>
          )}
        </div>

        {isActive ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">From Number</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{settings.twilio_phone_number}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">SMS Sent</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{smsSent ?? 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{smsPending ?? 0}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Reminder Schedule</h4>
              <div className="flex gap-4 text-sm text-gray-700">
                <span>1st: <strong>{reminderLabel(settings.default_reminder_1)}</strong></span>
                <span>2nd: <strong>{reminderLabel(settings.default_reminder_2)}</strong></span>
              </div>
              <div className="flex gap-4 mt-1 text-xs text-gray-500">
                <span>SMS on assignment: {settings.send_assignment_sms ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">SMS is not set up for your organization yet.</p>
            <p className="text-xs text-gray-400 mt-1">Contact your account administrator to enable SMS reminders.</p>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">How Job Reminders Work</h3>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2"><span className="text-blue-600 font-bold">1.</span> Assign an employee to a job with a scheduled time</li>
          <li className="flex gap-2"><span className="text-blue-600 font-bold">2.</span> They receive an SMS immediately (if enabled)</li>
          <li className="flex gap-2"><span className="text-blue-600 font-bold">3.</span> Automatic reminders are sent before the job starts</li>
          <li className="flex gap-2"><span className="text-blue-600 font-bold">4.</span> Each SMS includes job name, location, time, and login link</li>
        </ol>
      </div>
    </div>
  )
}
