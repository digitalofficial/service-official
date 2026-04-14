import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

const noteSchema = z.object({
  body: z.string().min(1, 'Note body is required').max(5000),
})

async function verifyAddress(supabase: any, orgId: string, customerId: string, addressId: string) {
  const { data } = await supabase
    .from('customer_addresses')
    .select('id')
    .eq('id', addressId)
    .eq('customer_id', customerId)
    .eq('organization_id', orgId)
    .single()
  return !!data
}

export async function GET(_: NextRequest, { params }: { params: { id: string; addressId: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  if (!(await verifyAddress(supabase, profile.organization_id, params.id, params.addressId))) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('customer_address_notes')
    .select('*, author:profiles!author_id(id, first_name, last_name, avatar_url)')
    .eq('address_id', params.addressId)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest, { params }: { params: { id: string; addressId: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase, user } = result

  if (!(await verifyAddress(supabase, profile.organization_id, params.id, params.addressId))) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 })
  }

  let body
  try {
    body = noteSchema.parse(await request.json())
  } catch (err: any) {
    return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('customer_address_notes')
    .insert({
      organization_id: profile.organization_id,
      customer_id: params.id,
      address_id: params.addressId,
      author_id: user.id,
      body: body.body,
    })
    .select('*, author:profiles!author_id(id, first_name, last_name, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, success: true }, { status: 201 })
}
