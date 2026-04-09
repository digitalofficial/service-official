import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().optional(),
  serial_number: z.string().optional(),
  vin: z.string().optional(),
  license_plate: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.number().optional(),
  current_value: z.number().optional(),
  daily_rate: z.number().optional(),
  hourly_rate: z.number().optional(),
  status: z.enum(['available', 'assigned', 'maintenance', 'repair', 'retired']).optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  current_location: z.string().optional(),
  last_service_date: z.string().optional(),
  next_service_date: z.string().optional(),
  service_interval_days: z.number().int().optional(),
  meter_reading: z.number().optional(),
  meter_unit: z.enum(['hours', 'miles', 'kilometers']).optional(),
  insurance_policy: z.string().optional(),
  insurance_expiry: z.string().optional(),
  photo_url: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

  const { data: equipment, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)
    .single()

  if (error || !equipment) return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })

  // Fetch current assignment
  const { data: assignments } = await supabase
    .from('equipment_assignments')
    .select('*, project:projects(id, name), assignee:profiles!assigned_to(first_name, last_name)')
    .eq('equipment_id', params.id)
    .is('actual_return_date', null)
    .order('start_date', { ascending: false })
    .limit(1)

  // Fetch maintenance history
  const { data: maintenance } = await supabase
    .from('equipment_maintenance')
    .select('*, performer:profiles!performed_by(first_name, last_name)')
    .eq('equipment_id', params.id)
    .order('scheduled_date', { ascending: false })
    .limit(20)

  // Fetch all assignments history
  const { data: allAssignments } = await supabase
    .from('equipment_assignments')
    .select('*, project:projects(id, name), assignee:profiles!assigned_to(first_name, last_name)')
    .eq('equipment_id', params.id)
    .order('start_date', { ascending: false })
    .limit(50)

  return NextResponse.json({
    data: {
      ...equipment,
      current_assignment: assignments?.[0] || null,
      maintenance: maintenance || [],
      assignments: allAssignments || [],
    }
  })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()
  if (!['owner', 'admin', 'office_manager'].includes(profile!.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json()
  const validated = updateSchema.parse(body)

  const { data, error } = await supabase
    .from('equipment')
    .update({ ...validated, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, success: true })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()
  if (!['owner', 'admin'].includes(profile!.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Soft delete
  const { error } = await supabase
    .from('equipment')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
