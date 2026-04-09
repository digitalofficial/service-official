import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { z } from 'zod'

const assignSchema = z.object({
  project_id: z.string().uuid().optional(),
  job_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  start_date: z.string(),
  end_date: z.string().optional(),
  daily_rate: z.number().optional(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()
  if (!['owner', 'admin', 'office_manager', 'project_manager', 'foreman', 'dispatcher'].includes(profile!.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Verify equipment belongs to org and is available
  const { data: equipment } = await supabase
    .from('equipment')
    .select('id, status, daily_rate')
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)
    .single()

  if (!equipment) return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
  if (equipment.status === 'assigned') {
    return NextResponse.json({ error: 'Equipment is already assigned' }, { status: 400 })
  }
  if (equipment.status === 'retired') {
    return NextResponse.json({ error: 'Equipment is retired' }, { status: 400 })
  }

  const body = await request.json()
  const validated = assignSchema.parse(body)

  // Create assignment
  const { data: assignment, error: assignError } = await supabase
    .from('equipment_assignments')
    .insert({
      equipment_id: params.id,
      ...validated,
      daily_rate: validated.daily_rate ?? equipment.daily_rate,
      created_by: user.id,
    })
    .select()
    .single()

  if (assignError) return NextResponse.json({ error: assignError.message }, { status: 500 })

  // Update equipment status
  await supabase
    .from('equipment')
    .update({
      status: 'assigned',
      current_location: validated.project_id ? 'On project site' : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  return NextResponse.json({ data: assignment, success: true }, { status: 201 })
}
