import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

const maintenanceSchema = z.object({
  type: z.enum(['preventive', 'corrective', 'inspection', 'calibration']).default('preventive'),
  title: z.string().min(1),
  description: z.string().optional(),
  scheduled_date: z.string().optional(),
  completed_date: z.string().optional(),
  cost: z.number().optional(),
  vendor_name: z.string().optional(),
  meter_reading: z.number().optional(),
  next_service_date: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'skipped']).default('scheduled'),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { supabase } = result

  const { data: maintenance, error } = await supabase
    .from('equipment_maintenance')
    .select('*, performer:profiles!performed_by(first_name, last_name)')
    .eq('equipment_id', params.id)
    .order('scheduled_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: maintenance })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

  const body = await request.json()
  const validated = maintenanceSchema.parse(body)

  const { data, error } = await supabase
    .from('equipment_maintenance')
    .insert({
      equipment_id: params.id,
      organization_id: profile.organization_id,
      ...validated,
      performed_by: validated.status === 'completed' ? user.id : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update equipment if maintenance is completed
  if (validated.status === 'completed') {
    const updates: Record<string, unknown> = {
      last_service_date: validated.completed_date || new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    }
    if (validated.next_service_date) updates.next_service_date = validated.next_service_date
    if (validated.meter_reading) updates.meter_reading = validated.meter_reading

    await supabase.from('equipment').update(updates).eq('id', params.id)
  }

  // If scheduling maintenance, update equipment status
  if (validated.status === 'in_progress') {
    await supabase.from('equipment').update({ status: 'maintenance', updated_at: new Date().toISOString() }).eq('id', params.id)
  }

  return NextResponse.json({ data, success: true }, { status: 201 })
}
