import { createServerSupabaseClient } from '@service-official/database'
import { BrandingForm } from './branding-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Branding Settings' }

export default async function BrandingPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, organization:organizations(id, name, logo_url, primary_color, secondary_color)')
    .eq('id', user!.id)
    .single()

  const org = (profile as any)?.organization

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-900">Branding</h2>
      <BrandingForm
        orgId={org?.id}
        logoUrl={org?.logo_url}
        primaryColor={org?.primary_color ?? '#2563eb'}
        secondaryColor={org?.secondary_color ?? '#1e3a5f'}
        orgName={org?.name ?? 'Your Company'}
      />
    </div>
  )
}
