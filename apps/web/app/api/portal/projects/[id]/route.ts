import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { getPortalUserWithPermissions } from '@/lib/portal/permissions'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getPortalUserWithPermissions(request)
  if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { portalUser, permissions } = result
  if (!permissions.view_projects) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const supabase = createServiceRoleClient()

  // Verify project belongs to customer and portal is enabled
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, status, description, estimated_start_date, estimated_end_date, contract_value')
    .eq('id', params.id)
    .eq('customer_id', portalUser.customer_id)
    .eq('client_portal_enabled', true)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Fetch related data in parallel — respect permissions
  const [phasesRes, milestonesRes, photosRes, filesRes, messagesRes] = await Promise.all([
    supabase.from('project_phases').select('*').eq('project_id', params.id).order('order_index'),
    supabase.from('project_milestones').select('*').eq('project_id', params.id).order('due_date'),
    permissions.view_photos
      ? supabase.from('photos').select('*').eq('project_id', params.id).eq('is_public', true).order('created_at', { ascending: false }).limit(50)
      : Promise.resolve({ data: [] }),
    permissions.view_files
      ? supabase.from('files').select('*').eq('project_id', params.id).eq('is_public', true).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    permissions.send_messages
      ? supabase.from('portal_messages').select('*').eq('project_id', params.id).eq('organization_id', portalUser.organization_id).order('created_at', { ascending: false }).limit(50)
      : Promise.resolve({ data: [] }),
  ])

  const phases = phasesRes.data || []
  const completed = phases.filter(p => p.status === 'completed').length
  const progress = phases.length > 0 ? Math.round(completed / phases.length * 100) : 0

  return NextResponse.json({
    data: {
      project,
      phases,
      milestones: milestonesRes.data || [],
      photos: photosRes.data || [],
      files: filesRes.data || [],
      messages: messagesRes.data || [],
      progress_percent: progress,
      permissions,
    }
  })
}
