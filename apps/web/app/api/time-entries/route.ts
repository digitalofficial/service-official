import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { z } from 'zod'

const timeEntrySchema = z.object({
  job_id: z.string().uuid(),
  profile_id: z.string().uuid(),
  date: z.string(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  hours: z.number().positive().max(24),
  break_minutes: z.number().min(0).default(0),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

  const { searchParams } = new URL(request.url)
  const job_id = searchParams.get('job_id')

  let query = supabase
    .from('time_entries')
    .select('*, profile:profiles!profile_id(id, first_name, last_name, avatar_url, hourly_rate, role)')
    .eq('organization_id', profile!.organization_id)
    .is('deleted_at', null)
    .order('date', { ascending: false })

  if (job_id) query = query.eq('job_id', job_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, hourly_rate')
    .eq('id', user.id)
    .single()

  const body = await request.json()
  const validated = timeEntrySchema.parse(body)

  // Get the target profile's hourly rate
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('hourly_rate')
    .eq('id', validated.profile_id)
    .single()

  const rate = targetProfile?.hourly_rate ?? 0
  const totalPay = validated.hours * rate

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      organization_id: profile!.organization_id,
      job_id: validated.job_id,
      profile_id: validated.profile_id,
      date: validated.date,
      start_time: validated.start_time || null,
      end_time: validated.end_time || null,
      hours: validated.hours,
      break_minutes: validated.break_minutes,
      hourly_rate: rate,
      total_pay: totalPay,
      description: validated.description || null,
      created_by: user.id,
    })
    .select('*, profile:profiles!profile_id(id, first_name, last_name, avatar_url, hourly_rate, role)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, success: true }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()
  const managerRoles = ['owner', 'admin', 'office_manager', 'project_manager']
  const isManager = managerRoles.includes(profile?.role ?? '')

  // Non-managers can only delete their own time entries
  if (!isManager) {
    const { data: entry } = await supabase.from('time_entries').select('created_by').eq('id', id).single()
    if (entry?.created_by !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own time entries' }, { status: 403 })
    }
  }

  const { error } = await supabase
    .from('time_entries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', profile!.organization_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
