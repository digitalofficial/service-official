import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'

// POST /api/admin/clients/[id]/stripe — save Stripe settings for a client org
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (request.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()

  // Verify org exists
  const { data: org } = await supabase.from('organizations').select('id').eq('id', params.id).single()
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

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

  // Stripe account ID
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
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
