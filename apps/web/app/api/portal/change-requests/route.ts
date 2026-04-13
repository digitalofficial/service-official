import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { getPortalUserWithPermissions } from '@/lib/portal/permissions'

export async function GET(request: NextRequest) {
  try {
    const result = await getPortalUserWithPermissions(request)
    if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { portalUser } = result
    const supabase = createServiceRoleClient()

    const projectId = request.nextUrl.searchParams.get('project_id')

    let query = supabase
      .from('change_requests')
      .select('*, submitted_by_user:portal_users!submitted_by(id, email, company_name, role), reviewed_by_user:profiles!reviewed_by(id, first_name, last_name)')
      .eq('organization_id', portalUser.organization_id)
      .order('created_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    // Portal users can only see change requests they submitted or for projects they're linked to
    query = query.eq('submitted_by', portalUser.id)

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getPortalUserWithPermissions(request)
    if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { portalUser } = result
    const body = await request.json()
    const { title, description, project_id } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
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
      .from('change_requests')
      .insert({
        organization_id: portalUser.organization_id,
        project_id,
        submitted_by: portalUser.id,
        title: title.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Log activity
    await supabase.from('portal_activity_log').insert({
      portal_user_id: portalUser.id,
      action: 'submitted_change_request',
      entity_type: 'change_request',
      entity_id: data.id,
    })

    return NextResponse.json({ data, success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
