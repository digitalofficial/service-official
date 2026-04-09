import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

async function getPortalUser(request: NextRequest) {
  const sessionCookie = request.cookies.get('portal_session')?.value
  if (!sessionCookie) return null

  const portalUserId = sessionCookie.split(':')[0]
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('portal_users')
    .select('id, customer_id, organization_id')
    .eq('id', portalUserId)
    .eq('is_active', true)
    .single()

  return data
}

export async function GET(request: NextRequest) {
  const portalUser = await getPortalUser(request)
  if (!portalUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()

  // Get projects for this customer with portal enabled
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, status, description, estimated_start_date, estimated_end_date, contract_value')
    .eq('customer_id', portalUser.customer_id)
    .eq('organization_id', portalUser.organization_id)
    .eq('client_portal_enabled', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Compute progress for each project
  const enriched = await Promise.all((projects || []).map(async (p) => {
    const { data: phases } = await supabase
      .from('project_phases')
      .select('status')
      .eq('project_id', p.id)

    const total = phases?.length || 0
    const completed = phases?.filter(ph => ph.status === 'completed').length || 0
    const progress = total > 0 ? Math.round(completed / total * 100) : 0

    return { ...p, progress_percent: progress }
  }))

  return NextResponse.json({ data: enriched })
}
