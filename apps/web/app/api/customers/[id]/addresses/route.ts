import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { geocodeAddress } from '@/lib/geocode'
import { z } from 'zod'

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required').max(100),
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().default('US'),
  is_primary: z.boolean().default(false),
  notes: z.string().optional(),
})

// GET /api/customers/[id]/addresses — list all addresses for a customer
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('customer_id', params.id)
    .eq('organization_id', profile.organization_id)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/customers/[id]/addresses — add a new address
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  // Verify customer belongs to org
  const { data: customer } = await supabase
    .from('customers')
    .select('id, type')
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  const body = await request.json()
  const validated = addressSchema.parse(body)

  // Check if this is the first address — make it primary automatically
  const { count } = await supabase
    .from('customer_addresses')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', params.id)

  const isFirst = (count ?? 0) === 0
  const isPrimary = isFirst || validated.is_primary

  // If setting as primary, unset existing primary first
  if (isPrimary && !isFirst) {
    await supabase
      .from('customer_addresses')
      .update({ is_primary: false })
      .eq('customer_id', params.id)
      .eq('is_primary', true)
  }

  // Geocode (best-effort)
  const fullAddr = [validated.address_line1, validated.city, validated.state, validated.zip].filter(Boolean).join(', ')
  const geo = fullAddr ? await geocodeAddress(fullAddr) : null

  const { data, error } = await supabase
    .from('customer_addresses')
    .insert({
      ...validated,
      is_primary: isPrimary,
      customer_id: params.id,
      organization_id: profile.organization_id,
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync primary address to customer record
  if (isPrimary) {
    await syncPrimaryToCustomer(supabase, params.id, validated)
  }

  return NextResponse.json({ data, success: true }, { status: 201 })
}

async function syncPrimaryToCustomer(supabase: any, customerId: string, address: any) {
  await supabase
    .from('customers')
    .update({
      address_line1: address.address_line1,
      address_line2: address.address_line2 ?? null,
      city: address.city ?? null,
      state: address.state ?? null,
      zip: address.zip ?? null,
      country: address.country ?? 'US',
    })
    .eq('id', customerId)
}
