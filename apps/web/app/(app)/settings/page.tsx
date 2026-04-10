import { getProfile } from '@/lib/auth/get-profile'
import { Button } from '@/components/ui/button'
import { EditCompanyButton } from './settings-edit'
import { DangerZone } from './danger-zone'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'General Settings' }

export default async function GeneralSettingsPage() {
  const { supabase, profile } = await getProfile()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .single()
  const isOwner = profile?.role === 'owner'

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Company Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Company Name" value={org?.name} />
          <Field label="Industry" value={org?.industry?.replace('_', ' ')} />
          <Field label="Phone" value={org?.phone} />
          <Field label="Email" value={org?.email} />
          <Field label="Website" value={org?.website} />
          <Field label="Timezone" value={org?.timezone} />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Street" value={org?.address_line1} />
            <Field label="City" value={org?.city} />
            <Field label="State" value={org?.state} />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <EditCompanyButton org={org ?? {}} />
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Subscription</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              Plan: <span className="font-semibold text-gray-900 capitalize">{org?.subscription_tier ?? 'solo'}</span>
            </p>
            <p className="text-sm text-gray-600 mt-0.5">
              Status: <span className="capitalize font-medium">{org?.subscription_status ?? 'active'}</span>
            </p>
            {org?.trial_ends_at && (
              <p className="text-sm text-gray-500 mt-0.5">
                Trial ends: {new Date(org.trial_ends_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button variant="outline">Manage Billing</Button>
        </div>
      </div>

      {/* Danger Zone — only visible to owners */}
      {isOwner && <DangerZone orgName={org?.name ?? ''} />}
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value ?? <span className="text-gray-400">Not set</span>}</p>
    </div>
  )
}
