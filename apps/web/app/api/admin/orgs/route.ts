import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@service-official/database'

export async function GET(request: NextRequest) {
  // Verify the user is a super admin
  const authClient = createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceRoleClient()

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role, organization:organizations(slug)')
    .eq('id', user.id)
    .single()

  const org = profile?.organization as any
  const isSuperAdmin = org?.slug === 'service-official' && profile?.role === 'owner'
  if (!isSuperAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data, error } = await serviceClient
    .from('organizations')
    .select('id, name, slug, industry, subscription_tier, subscription_status')
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
