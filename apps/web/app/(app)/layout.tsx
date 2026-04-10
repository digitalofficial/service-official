import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerSupabaseClient, createServiceRoleClient } from '@service-official/database'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'
import { OrgSwitcher } from '@/components/admin/org-switcher'
import { AlfredChat } from '@/components/alfred/alfred-chat'
import { OnboardingTour } from '@/components/onboarding/onboarding-tour'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Get the user's own profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Auto-create org + profile for new users from signup metadata — use service role to bypass RLS
    const serviceClient = createServiceRoleClient()
    const meta = user.user_metadata ?? {}

    // First check if profile exists but RLS blocked it
    const { data: existingProfile } = await serviceClient
      .from('profiles')
      .select('*, organization:organizations(*)')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      profile = existingProfile
    } else {
      const base = (meta.company_name || 'company').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      const slug = `${base}-${Date.now().toString(36)}`

      const { data: org } = await serviceClient
        .from('organizations')
        .insert({
          name: meta.company_name || `${meta.first_name ?? 'My'}'s Company`,
          industry: meta.industry || 'other',
          slug,
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
        const { data: newProfile } = await serviceClient
          .from('profiles')
          .insert({
            id: user.id,
            organization_id: org.id,
            email: user.email!,
            first_name: meta.first_name || user.email!.split('@')[0],
            last_name: meta.last_name || '',
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
  }

  // Fallback profile
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

  // Check if this user is a super admin
  const userOrg = (profile as any).organization
  const isSuperAdmin = userOrg?.slug === 'service-official' && profile.role === 'owner'

  // Check for admin org override cookie
  let activeOrg = userOrg
  let activeOrgId = profile.organization_id
  const cookieStore = cookies()
  const adminOrgCookie = cookieStore.get('so-admin-org')?.value

  if (isSuperAdmin && adminOrgCookie && adminOrgCookie !== profile.organization_id) {
    // Super admin is viewing another org — fetch that org's data
    const serviceClient = createServiceRoleClient()
    const { data: overrideOrg } = await serviceClient
      .from('organizations')
      .select('*')
      .eq('id', adminOrgCookie)
      .single()

    if (overrideOrg) {
      activeOrg = overrideOrg
      activeOrgId = overrideOrg.id
    }
  }

  // Pass activeOrgId as a data attribute so client components can read it
  return (
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden max-w-[100vw]" data-org-id={activeOrgId}>
      <Sidebar profile={profile} organization={activeOrg} isSuperAdmin={isSuperAdmin} tier={activeOrg?.subscription_tier ?? 'solo'} subscriptionStatus={activeOrg?.subscription_status} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex items-center justify-between h-14 px-4 lg:px-6 bg-white border-b border-gray-200 shrink-0">
          {/* Left side — spacer for hamburger on mobile + org switcher */}
          <div className="flex items-center gap-3">
            <div className="w-9 lg:hidden" /> {/* Spacer for hamburger button */}
            {isSuperAdmin && (
              <OrgSwitcher
                currentOrgId={activeOrgId}
                currentOrgName={activeOrg?.name ?? 'Unknown'}
                isSuperAdmin={isSuperAdmin}
              />
            )}
          </div>
          <TopBar profile={profile} />
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
      <AlfredChat userName={profile.first_name} />
      {['owner', 'admin'].includes(profile.role) && (
        <OnboardingTour profileId={profile.id ?? user.id} />
      )}
    </div>
  )
}
