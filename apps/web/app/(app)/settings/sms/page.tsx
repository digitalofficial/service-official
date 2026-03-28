import { createServerSupabaseClient } from '@service-official/database'
import { SmsSettingsForm } from './sms-settings-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'SMS Settings' }

export default async function SmsSettingsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user!.id).single()

  if (!['owner', 'admin'].includes(profile?.role ?? '')) {
    return <p className="text-sm text-gray-500">Only owners and admins can manage SMS settings.</p>
  }

  const { data: settings } = await supabase
    .from('organization_sms_settings')
    .select('*')
    .eq('organization_id', profile!.organization_id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">SMS & Reminders</h2>
        <p className="text-sm text-gray-500 mt-0.5">Configure your Twilio account for sending job reminders and notifications</p>
      </div>
      <SmsSettingsForm orgId={profile!.organization_id} existing={settings} />
    </div>
  )
}
