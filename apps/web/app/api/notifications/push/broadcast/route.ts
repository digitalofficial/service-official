import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@service-official/database'
import { broadcastPushToAll } from '@service-official/notifications'

// POST /api/notifications/push/broadcast — send push to all users (super admin only)
export async function POST(request: NextRequest) {
  const authClient = createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify super admin (service-official org owner)
  const supabase = createServiceRoleClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization:organizations(slug)')
    .eq('id', user.id)
    .single()

  const org = profile?.organization as any
  if (org?.slug !== 'service-official' || profile?.role !== 'owner') {
    return NextResponse.json({ error: 'Super admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const { title, body: messageBody, organization_id } = body

  if (!title || !messageBody) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
  }

  const result = await broadcastPushToAll({
    title,
    body: messageBody,
    organization_id: organization_id || undefined,
  })

  return NextResponse.json(result)
}
