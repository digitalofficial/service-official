import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { getPortalUserWithPermissions } from '@/lib/portal/permissions'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getPortalUserWithPermissions(request)
  if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { portalUser, permissions } = result
  if (!permissions.send_messages) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const supabase = createServiceRoleClient()
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
