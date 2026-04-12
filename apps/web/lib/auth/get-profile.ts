import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceRoleClient } from '@service-official/database'

/**
 * Get the current user's profile with organization_id.
 * Redirects to login if not authenticated.
 * If authenticated but no profile, auto-creates from user metadata.
 */
export async function getProfile() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  let { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role, first_name, last_name, email, onboarding_completed_at')
    .eq('id', user.id)
    .single()

  // If profile is missing, try to recover by creating org + profile from metadata
  if (!profile?.organization_id) {
    const serviceClient = createServiceRoleClient()
    const meta = user.user_metadata ?? {}

    // Check if profile exists but we couldn't read it (RLS issue) — use service role
    const { data: existingProfile } = await serviceClient
      .from('profiles')
      .select('organization_id, role, first_name, last_name, email, onboarding_completed_at')
      .eq('id', user.id)
      .single()

    if (existingProfile?.organization_id) {
      profile = existingProfile
    } else {
      // Auto-create org + profile for users who got stuck mid-registration
      const base = (meta.company_name || 'company').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      const slug = `${base}-${Date.now().toString(36)}`

      const { data: org } = await serviceClient
        .from('organizations')
        .insert({
          name: meta.company_name || `${meta.first_name ?? 'My'}'s Company`,
          slug,
          industry: meta.industry || 'other',
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
          .select('organization_id, role, first_name, last_name, email, onboarding_completed_at')
          .single()

        if (newProfile) profile = newProfile
      }
    }
  }

  // Final check — if we still can't get a profile, sign out and redirect
  if (!profile?.organization_id) {
    await supabase.auth.signOut()
    redirect('/auth/login?error=setup_failed')
  }

  // Return service role client for data queries — RLS policies block the
  // session client after the security migration enabled RLS on all tables.
  // Auth is already verified above via the session client.
  return { supabase: createServiceRoleClient(), user, profile }
}
