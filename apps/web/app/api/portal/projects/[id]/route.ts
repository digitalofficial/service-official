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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const portalUser = await getPortalUser(request)
  if (!portalUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  // Verify project belongs to customer and portal is enabled
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, status, description, estimated_start_date, estimated_end_date, contract_value')
    .eq('id', params.id)
    .eq('customer_id', portalUser.customer_id)
    .eq('client_portal_enabled', true)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Fetch related data in parallel
  const [phasesRes, milestonesRes, photosRes, filesRes, messagesRes] = await Promise.all([
    supabase.from('project_phases').select('*').eq('project_id', params.id).order('order_index'),
    supabase.from('project_milestones').select('*').eq('project_id', params.id).order('due_date'),
    supabase.from('photos').select('*').eq('project_id', params.id).eq('is_public', true).order('created_at', { ascending: false }).limit(50),
    supabase.from('files').select('*').eq('project_id', params.id).eq('is_public', true).order('created_at', { ascending: false }),
    supabase.from('portal_messages').select('*').eq('project_id', params.id).eq('organization_id', portalUser.organization_id).order('created_at', { ascending: false }).limit(50),
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
    }
  })
}
