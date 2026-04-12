import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { trigger } from '@service-official/workflows'
import { notifyCustomer } from '@/lib/sms'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      customer:customers(*),
      assignee:profiles!assigned_to(*),
      project:projects(id, name, status),
      photos(*)
    `)
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
    .is('deleted_at', null)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const updates = await request.json()

  const { data: existing } = await supabase.from('jobs').select('status, title').eq('id', params.id).eq('organization_id', profile.organization_id).single()

  // Auto-update status when schedule is added to an unscheduled job
  if (updates.scheduled_start && existing?.status === 'unscheduled' && !updates.status) {
    updates.status = 'scheduled'
  }

  // Set timestamps on status transitions
  if (updates.status === 'in_progress' && !updates.actual_start) {
    updates.actual_start = new Date().toISOString()
  }
  if (updates.status === 'completed' && !updates.actual_end) {
    updates.actual_end = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (updates.status && updates.status !== existing?.status) {
    trigger('job.status_changed')(
      profile.organization_id, 'job', params.id,
      { status: updates.status, job_title: existing?.title },
      { status: existing?.status }
    )
    if (updates.status === 'completed') {
      trigger('job.completed')(
        profile.organization_id, 'job', params.id,
        { job_title: existing?.title }
      )
    }

    // Auto-send customer SMS on key status changes
    if (updates.status === 'en_route') {
      notifyCustomer(profile.organization_id, params.id, 'on_the_way').catch(() => {})
    }
    if (updates.status === 'completed') {
      notifyCustomer(profile.organization_id, params.id, 'completed').catch(() => {})
    }
  }

  return NextResponse.json({ data, sms_sent: updates.status === 'en_route' || updates.status === 'completed' })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile({ requireRole: ['owner'] })
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { error } = await supabase
    .from('jobs')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
