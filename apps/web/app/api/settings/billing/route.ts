import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

const VALID_TIERS = ['solo', 'team', 'growth', 'enterprise']
const VALID_STATUSES = ['active', 'canceled', 'paused']

// PATCH /api/settings/billing — update subscription tier and/or status
export async function PATCH(request: NextRequest) {
  const result = await getApiProfile({ requireRole: ['owner'] })
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const body = await request.json()
  const updates: Record<string, any> = {}

  if (body.subscription_tier) {
    if (!VALID_TIERS.includes(body.subscription_tier)) {
      return NextResponse.json({ error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}` }, { status: 400 })
    }
    updates.subscription_tier = body.subscription_tier
  }

  if (body.subscription_status) {
    if (!VALID_STATUSES.includes(body.subscription_status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
    }
    updates.subscription_status = body.subscription_status
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
  }

  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', profile.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
