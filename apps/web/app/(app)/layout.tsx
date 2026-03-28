import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@service-official/database'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Try to get profile, create one if it doesn't exist yet (first login)
  let { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Auto-create org + profile for new users from signup metadata
    const meta = user.user_metadata ?? {}

    // Create organization
    const { data: org } = await supabase
      .from('organizations')
      .insert({
        name: meta.company_name || `${meta.first_name ?? 'My'}'s Company`,
        industry: meta.industry || 'other',
        slug: (meta.company_name || 'company').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        phone: meta.phone || null,
        timezone: 'America/Denver',
        currency: 'USD',
        primary_color: '#2563eb',
        secondary_color: '#1e3a5f',
        subscription_tier: 'solo',
        subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        settings: {},
      })
      .select()
      .single()

    if (org) {
      // Create profile
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          organization_id: org.id,
          email: user.email!,
          first_name: meta.first_name || user.email!.split('@')[0],
          last_name: meta.last_name || '',
          full_name: `${meta.first_name || ''} ${meta.last_name || ''}`.trim() || user.email!.split('@')[0],
          role: 'owner',
          is_active: true,
          notify_sms: true,
          notify_email: true,
          notify_push: true,
        })
        .select('*, organization:organizations(*)')
        .single()

      if (newProfile) profile = newProfile
    }
  }

  // Fallback profile for when DB tables don't exist yet
  if (!profile) {
    const meta = user.user_metadata ?? {}
    profile = {
      id: user.id,
      first_name: meta.first_name || user.email?.split('@')[0] || 'User',
      last_name: meta.last_name || '',
      email: user.email || '',
      role: 'owner',
      organization_id: '',
    } as any
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar profile={profile} organization={(profile as any).organization} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
