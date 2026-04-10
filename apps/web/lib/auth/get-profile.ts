import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@service-official/database'

/**
 * Get the current user's profile with organization_id.
 * Redirects to login if not authenticated or profile not found.
 */
export async function getProfile() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role, first_name, last_name, email')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) redirect('/auth/login')

  return { supabase, user, profile }
}
