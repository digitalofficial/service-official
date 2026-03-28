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
    .single()

  if (!profile) return NextResponse.json({ error: 'No owner found' }, { status: 404 })

  // Get their domain
  const { data: domain } = await supabase
    .from('organization_domains')
    .select('domain')
    .eq('organization_id', params.id)
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

  return NextResponse.json({
    magic_link: data.properties?.action_link,
    email: profile.email,
    app_url: appUrl,
  })
}
