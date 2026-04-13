import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { getPortalUserWithPermissions } from '@/lib/portal/permissions'

export async function GET(request: NextRequest) {
  try {
    const result = await getPortalUserWithPermissions(request)
    if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { portalUser, permissions } = result
    if (!permissions.send_messages) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

    const projectId = request.nextUrl.searchParams.get('project_id')
    if (!projectId) return NextResponse.json({ error: 'project_id is required' }, { status: 400 })

    const supabase = createServiceRoleClient()

    // Verify project belongs to customer
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('customer_id', portalUser.customer_id)
      .eq('client_portal_enabled', true)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const { data: messages, error } = await supabase
      .from('portal_messages')
      .select('*, portal_user:portal_users(id, email), staff_user:profiles!portal_messages_staff_user_id_fkey(id, first_name, last_name)')
      .eq('project_id', projectId)
      .eq('organization_id', portalUser.organization_id)
      .order('created_at', { ascending: true })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: messages })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getPortalUserWithPermissions(request)
    if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { portalUser, permissions } = result
    if (!permissions.send_messages) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

    const body = await request.json()
    const { message, project_id } = body

    if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    if (!project_id) return NextResponse.json({ error: 'project_id is required' }, { status: 400 })

    const supabase = createServiceRoleClient()

    // Verify project belongs to customer
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('customer_id', portalUser.customer_id)
      .eq('client_portal_enabled', true)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('portal_messages')
      .insert({
        organization_id: portalUser.organization_id,
        project_id,
        portal_user_id: portalUser.id,
        direction: 'client_to_staff',
        body: message.trim(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Log activity
    await supabase.from('portal_activity_log').insert({
      portal_user_id: portalUser.id,
      action: 'sent_message',
      entity_type: 'project',
      entity_id: project_id,
    })

    return NextResponse.json({ data, success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
