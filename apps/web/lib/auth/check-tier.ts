import { createServerSupabaseClient, createServiceRoleClient } from '@service-official/database'
import { NextResponse } from 'next/server'
import { tierHasFeature, getTierMaxUsers } from './tier-access'

/**
 * Check if the current user's org has access to a feature based on their tier.
 * Returns null if allowed, or a NextResponse with upgrade message if blocked.
 */
export async function checkTierAccess(feature: string): Promise<{
  allowed: boolean
  response?: NextResponse
  profile?: any
  org?: any
}> {
  const authClient = createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { allowed: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const supabase = createServiceRoleClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role, organization:organizations(subscription_tier, subscription_status)')
    .eq('id', user.id)
    .single()

  if (!profile) return { allowed: false, response: NextResponse.json({ error: 'Profile not found' }, { status: 404 }) }

  const org = (profile as any).organization
  const tier = org?.subscription_tier ?? 'solo'

  if (!tierHasFeature(tier, feature)) {
    return {
      allowed: false,
      response: NextResponse.json({
        error: 'Feature not available on your plan',
        upgrade_required: true,
        current_tier: tier,
        feature,
      }, { status: 403 }),
      profile,
      org,
    }
  }

  return { allowed: true, profile, org }
}

/**
 * Check if the org can add more users based on their tier.
 */
export async function checkUserLimit(organizationId: string, tier: string): Promise<{
  allowed: boolean
  current: number
  max: number
}> {
  const supabase = createServiceRoleClient()

  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_active', true)

  const current = count ?? 0
  const max = getTierMaxUsers(tier)

  return { allowed: current < max, current, max }
}
