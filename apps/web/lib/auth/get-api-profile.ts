import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@service-official/database'

/**
 * Auth + profile helper for API routes.
 * Uses the session client for auth, then service role for profile queries
 * to avoid RLS issues with the profiles table.
 *
 * Returns { user, profile, supabase (service role) } or a NextResponse error.
 */
export async function getApiProfile(options?: { requireRole?: string[] }) {
  const authClient = createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const
  }

  const supabase = createServiceRoleClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, organization_id, role, first_name, last_name, email, organization:organizations(name, subscription_tier, subscription_status, timezone)')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return { error: NextResponse.json({ error: 'Profile not found' }, { status: 403 }) } as const
  }

  if (options?.requireRole && !options.requireRole.includes(profile.role)) {
    return { error: NextResponse.json({ error: `Only ${options.requireRole.join(', ')}s can perform this action` }, { status: 403 }) } as const
  }

  return { user, profile, supabase } as const
}
