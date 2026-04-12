import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

const equipmentSchema = z.object({
  name: z.string().min(1),
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
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
  current_location: z.string().optional(),
  service_interval_days: z.number().int().optional(),
  meter_reading: z.number().optional(),
  meter_unit: z.enum(['hours', 'miles', 'kilometers']).default('hours'),
  insurance_policy: z.string().optional(),
  insurance_expiry: z.string().optional(),
  photo_url: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

export async function GET(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { searchParams } = new URL(request.url)

  let query = supabase
    .from('equipment')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (searchParams.get('status')) query = query.eq('status', searchParams.get('status')!)
  if (searchParams.get('type')) query = query.eq('type', searchParams.get('type')!)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const result = await getApiProfile({ requireRole: ['owner', 'admin', 'office_manager'] })
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const body = await request.json()
  const validated = equipmentSchema.parse(body)

  const { data, error } = await supabase
    .from('equipment')
    .insert({
      ...validated,
      organization_id: profile.organization_id,
      status: 'available',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, success: true }, { status: 201 })
}
