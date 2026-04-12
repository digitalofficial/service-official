import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  // Get customer
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  if (!customer.email) return NextResponse.json({ error: 'Customer has no email address' }, { status: 400 })

  // Check if portal user already exists
  const { data: existing } = await supabase
    .from('portal_users')
    .select('id')
    .eq('customer_id', params.id)
    .eq('email', customer.email.toLowerCase())
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Portal user already exists for this customer' }, { status: 400 })
  }

  // Create portal user with magic link
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days for invite

  const { data: portalUser, error } = await supabase
    .from('portal_users')
    .insert({
      customer_id: params.id,
      organization_id: profile.organization_id,
      email: customer.email.toLowerCase(),
      magic_link_token: token,
      magic_link_expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enable portal access on customer
  await supabase
    .from('customers')
    .update({ portal_access: true })
    .eq('id', params.id)

  // TODO: Send invite email via Resend with link to /public/portal/login?token={token}

  return NextResponse.json({
    data: portalUser,
    success: true,
    invite_url: `/public/portal/login?token=${token}`,
  }, { status: 201 })
}
