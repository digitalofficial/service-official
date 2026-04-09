import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

async function getPortalUser(request: NextRequest) {
  const sessionCookie = request.cookies.get('portal_session')?.value
  if (!sessionCookie) return null
  const portalUserId = sessionCookie.split(':')[0]
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.from('portal_users').select('id, customer_id, organization_id').eq('id', portalUserId).eq('is_active', true).single()
  return data
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const portalUser = await getPortalUser(request)
  if (!portalUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()
  const body = await request.json()

  if (!body.body?.trim()) return NextResponse.json({ error: 'Message body required' }, { status: 400 })

  const { data, error } = await supabase
    .from('portal_messages')
    .insert({
      organization_id: portalUser.organization_id,
      project_id: params.id,
      portal_user_id: portalUser.id,
      direction: 'client_to_staff',
      body: body.body.trim(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log activity
  await supabase.from('portal_activity_log').insert({
    portal_user_id: portalUser.id,
    action: 'sent_message',
    entity_type: 'project',
    entity_id: params.id,
  })

  return NextResponse.json({ data, success: true }, { status: 201 })
}
