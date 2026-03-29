import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'

// POST /api/admin/clients/[id]/login-as
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (request.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()

  // Get the owner of this org
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('organization_id', params.id)
    .eq('role', 'owner')
    .limit(1)
    .single()

  if (!profile) return NextResponse.json({ error: 'No owner found for this organization' }, { status: 404 })

  // Get their domain
  const { data: domain } = await supabase
    .from('organization_domains')
    .select('domain')
    .eq('organization_id', params.id)
    .eq('is_primary', true)
    .single()

  const appUrl = domain?.domain
    ? `https://${domain.domain}`
    : process.env.NEXT_PUBLIC_APP_URL

  // Generate magic link
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: profile.email,
    options: {
      redirectTo: `${appUrl}/dashboard`,
    },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // The action_link from Supabase points to their server.
  // We need to extract the token and build a link through our auth callback.
  const actionLink = data.properties?.action_link
  if (!actionLink) {
    return NextResponse.json({ error: 'Failed to generate login link' }, { status: 500 })
  }

  // Extract the token hash and type from the Supabase link
  // Format: https://xxx.supabase.co/auth/v1/verify?token=...&type=magiclink&redirect_to=...
  const url = new URL(actionLink)
  const token = url.searchParams.get('token')
  const type = url.searchParams.get('type')

  if (!token) {
    // Fallback: just use the raw action link
    return NextResponse.json({
      magic_link: actionLink,
      email: profile.email,
      app_url: appUrl,
    })
  }

  // Build the link through our auth callback which will exchange the code
  // Or use the Supabase verify endpoint directly with redirect
  const verifyUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(`${appUrl}/dashboard`)}`

  return NextResponse.json({
    magic_link: verifyUrl,
    email: profile.email,
    app_url: appUrl,
  })
}
