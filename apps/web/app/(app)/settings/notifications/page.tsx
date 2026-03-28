import { createServerSupabaseClient } from '@service-official/database'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notification Settings' }

const NOTIFICATION_GROUPS = [
  {
    label: 'Jobs',
    items: [
      { key: 'job_assigned', label: 'Job assigned to me' },
      { key: 'job_status_update', label: 'Job status changes' },
    ],
  },
  {
    label: 'Estimates & Invoices',
    items: [
      { key: 'estimate_approved', label: 'Estimate approved by customer' },
      { key: 'estimate_declined', label: 'Estimate declined' },
      { key: 'invoice_paid', label: 'Invoice payment received' },
      { key: 'invoice_overdue', label: 'Invoice overdue' },
    ],
  },
  {
    label: 'Projects',
    items: [
      { key: 'project_update', label: 'Project status changes' },
      { key: 'rfi_submitted', label: 'New RFI submitted' },
      { key: 'change_order_approved', label: 'Change order approved' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { key: 'message_received', label: 'New message from customer' },
      { key: 'client_message', label: 'Client portal message' },
    ],
  },
]

export default async function NotificationSettingsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('notify_sms, notify_email, notify_push')
    .eq('id', user!.id)
    .single()

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-900">Notification Preferences</h2>

      {/* Global toggles */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Channels</h3>
        <div className="space-y-3">
          <Toggle label="Email notifications" description="Receive updates via email" defaultChecked={profile?.notify_email} />
          <Toggle label="SMS notifications" description="Receive text message alerts" defaultChecked={profile?.notify_sms} />
          <Toggle label="Push notifications" description="Browser push notifications" defaultChecked={profile?.notify_push} />
        </div>
      </div>

      {/* Per-event settings */}
      {NOTIFICATION_GROUPS.map((group) => (
        <div key={group.label} className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{group.label}</h3>
          <div className="space-y-3">
            {group.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700">{item.label}</span>
                <div className="flex items-center gap-4">
                  <label className="text-xs text-gray-500 flex items-center gap-1.5">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    In-app
                  </label>
                  <label className="text-xs text-gray-500 flex items-center gap-1.5">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    Email
                  </label>
                  <label className="text-xs text-gray-500 flex items-center gap-1.5">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    SMS
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button>Save Preferences</Button>
      </div>
    </div>
  )
}

function Toggle({ label, description, defaultChecked }: { label: string; description: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        className={`relative w-10 h-5.5 rounded-full transition-colors ${defaultChecked ? 'bg-blue-600' : 'bg-gray-200'}`}
        style={{ width: 40, height: 22 }}
      >
        <span
          className="absolute top-0.5 rounded-full bg-white shadow transition-transform"
          style={{ width: 18, height: 18, left: defaultChecked ? 20 : 2 }}
        />
      </button>
    </div>
  )
}
