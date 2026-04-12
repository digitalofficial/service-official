import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

// GET /api/settings/payments — return org's payment settings (mask secret key)
export async function GET() {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_account_id, stripe_publishable_key, stripe_secret_key, stripe_webhook_secret, payments_enabled')
    .eq('id', profile.organization_id)
    .single()

  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  // Mask sensitive keys — show only last 8 chars
  const mask = (val: string | null) => {
    if (!val) return null
    if (val.length <= 12) return '••••••••'
    return '••••••••' + val.slice(-8)
  }

  // Get payment stats
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, status, created_at')
    .eq('organization_id', profile.organization_id)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const totalCollected = payments
    ?.filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0

  const pendingAmount = payments
    ?.filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0

  const thisMonth = payments
    ?.filter(p => p.status === 'succeeded' && p.created_at >= monthStart)
    .reduce((sum, p) => sum + (p.amount ?? 0), 0) ?? 0

  return NextResponse.json({
    stripe_account_id: org.stripe_account_id,
    stripe_publishable_key: org.stripe_publishable_key ? mask(org.stripe_publishable_key) : null,
    stripe_secret_key: org.stripe_secret_key ? mask(org.stripe_secret_key) : null,
    stripe_webhook_secret: org.stripe_webhook_secret ? mask(org.stripe_webhook_secret) : null,
    payments_enabled: org.payments_enabled ?? false,
    has_keys: !!(org.stripe_publishable_key && org.stripe_secret_key),
    stats: {
      total_collected: totalCollected,
      pending: pendingAmount,
      this_month: thisMonth,
    },
  })
}

// PATCH /api/settings/payments — save Stripe keys to org
export async function PATCH(request: NextRequest) {
  const result = await getApiProfile({ requireRole: ['owner', 'admin'] })
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const body = await request.json()
  const updates: Record<string, any> = {}

  // Validate and set publishable key
  if ('stripe_publishable_key' in body) {
    const pk = body.stripe_publishable_key
    if (pk && !pk.startsWith('pk_test_') && !pk.startsWith('pk_live_')) {
      return NextResponse.json({ error: 'Publishable key must start with pk_test_ or pk_live_' }, { status: 400 })
    }
    updates.stripe_publishable_key = pk || null
  }

  // Validate and set secret key
  if ('stripe_secret_key' in body) {
    const sk = body.stripe_secret_key
    if (sk && !sk.startsWith('sk_test_') && !sk.startsWith('sk_live_')) {
      return NextResponse.json({ error: 'Secret key must start with sk_test_ or sk_live_' }, { status: 400 })
    }
    updates.stripe_secret_key = sk || null
  }

  // Validate and set webhook secret
  if ('stripe_webhook_secret' in body) {
    const ws = body.stripe_webhook_secret
    if (ws && !ws.startsWith('whsec_')) {
      return NextResponse.json({ error: 'Webhook secret must start with whsec_' }, { status: 400 })
    }
    updates.stripe_webhook_secret = ws || null
  }

  // Stripe account ID (optional)
  if ('stripe_account_id' in body) {
    updates.stripe_account_id = body.stripe_account_id || null
  }

  // Payments enabled toggle
  if ('payments_enabled' in body) {
    updates.payments_enabled = !!body.payments_enabled
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', profile.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
