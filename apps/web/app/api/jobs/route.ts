import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { trigger } from '@service-official/workflows'
import { z } from 'zod'

const jobSchema = z.object({
  project_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduled_start: z.string().optional(),
  scheduled_end: z.string().optional(),
  address_line1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  assigned_to: z.string().uuid().optional(),
  instructions: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role, id')
    .eq('id', user.id)
    .single()

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const date = searchParams.get('date') // YYYY-MM-DD for calendar view
  const assigned_to = searchParams.get('assigned_to')

  let query = supabase
    .from('jobs')
    .select(`
      *,
      customer:customers(id, first_name, last_name, company_name, phone),
      assignee:profiles!assigned_to(id, first_name, last_name, avatar_url, phone),
      project:projects(id, name)
    `)
    .eq('organization_id', profile!.organization_id)
    .order('scheduled_start', { ascending: true })

  // Technicians only see their own jobs
  if (profile!.role === 'technician') {
    query = query.eq('assigned_to', user.id)
  }

  if (status) query = query.eq('status', status)
  if (assigned_to) query = query.eq('assigned_to', assigned_to)
  if (date) {
    const start = `${date}T00:00:00`
    const end = `${date}T23:59:59`
    query = query.gte('scheduled_start', start).lte('scheduled_start', end)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const body = await request.json()
  const validated = jobSchema.parse(body)

  // Auto job number
  const { count } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile!.organization_id)

  const job_number = `JOB-${String((count ?? 0) + 1).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      ...validated,
      job_number,
      organization_id: profile!.organization_id,
      created_by: user.id,
      status: 'unscheduled',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify assigned technician
  if (validated.assigned_to) {
    trigger('job.assigned')(
      profile!.organization_id,
      'job',
      data.id,
      { job_title: data.title, assigned_to: validated.assigned_to }
    )
  }

  return NextResponse.json({ data, success: true }, { status: 201 })
}
