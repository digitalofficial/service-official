import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { trigger } from '@service-official/workflows'
import { notifyCustomer } from '@/lib/sms'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

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
    .eq('organization_id', profile!.organization_id)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const updates = await request.json()

  const { data: existing } = await supabase.from('jobs').select('status, title').eq('id', params.id).eq('organization_id', profile!.organization_id).single()

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
    .eq('organization_id', profile!.organization_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (updates.status && updates.status !== existing?.status) {
    trigger('job.status_changed')(
      profile!.organization_id, 'job', params.id,
      { status: updates.status, job_title: existing?.title },
      { status: existing?.status }
    )
    if (updates.status === 'completed') {
      trigger('job.completed')(
        profile!.organization_id, 'job', params.id,
        { job_title: existing?.title }
      )
    }

    // Auto-send customer SMS on key status changes
    if (updates.status === 'en_route') {
      notifyCustomer(profile!.organization_id, params.id, 'on_the_way').catch(() => {})
    }
    if (updates.status === 'completed') {
      notifyCustomer(profile!.organization_id, params.id, 'completed').catch(() => {})
    }
  }

  return NextResponse.json({ data, sms_sent: updates.status === 'en_route' || updates.status === 'completed' })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()
  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Only owners can delete jobs' }, { status: 403 })
  }

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
