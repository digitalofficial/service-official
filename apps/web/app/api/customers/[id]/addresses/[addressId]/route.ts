import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { geocodeAddress } from '@/lib/geocode'

// PATCH /api/customers/[id]/addresses/[addressId] — update address or set as primary
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; addressId: string } }
) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const body = await request.json()
  const { set_primary, ...updates } = body

  // If setting as primary, unset existing primary first
  if (set_primary) {
    await supabase
      .from('customer_addresses')
      .update({ is_primary: false })
      .eq('customer_id', params.id)
      .eq('organization_id', profile.organization_id)
      .eq('is_primary', true)

    updates.is_primary = true
  }

  // Re-geocode when any address field changed
  const addrFieldsChanged = ['address_line1', 'city', 'state', 'zip'].some(k => k in updates)
  if (addrFieldsChanged) {
    const { data: current } = await supabase
      .from('customer_addresses')
      .select('address_line1, city, state, zip')
      .eq('id', params.addressId)
      .eq('organization_id', profile.organization_id)
      .single()
    const merged = { ...current, ...updates }
    const full = [merged.address_line1, merged.city, merged.state, merged.zip].filter(Boolean).join(', ')
    const geo = full ? await geocodeAddress(full) : null
    updates.lat = geo?.lat ?? null
    updates.lng = geo?.lng ?? null
  }

  const { data, error } = await supabase
    .from('customer_addresses')
    .update(updates)
    .eq('id', params.addressId)
    .eq('customer_id', params.id)
    .eq('organization_id', profile.organization_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync primary address to customer record
  if (set_primary || updates.is_primary) {
    await supabase
      .from('customers')
      .update({
        address_line1: data.address_line1,
        address_line2: data.address_line2,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
      })
      .eq('id', params.id)
  }

  return NextResponse.json({ data })
}

// DELETE /api/customers/[id]/addresses/[addressId] — remove an address
export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string; addressId: string } }
) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  // Don't allow deleting the primary address if there are other addresses
  const { data: address } = await supabase
    .from('customer_addresses')
    .select('is_primary')
    .eq('id', params.addressId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (address?.is_primary) {
    const { count } = await supabase
      .from('customer_addresses')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', params.id)
      .eq('organization_id', profile.organization_id)

    if ((count ?? 0) > 1) {
      return NextResponse.json(
        { error: 'Cannot delete the primary address. Set another address as primary first.' },
        { status: 400 }
      )
    }
  }

  const { error } = await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', params.addressId)
    .eq('customer_id', params.id)
    .eq('organization_id', profile.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If we deleted the primary (and it was the only one), clear customer address
  if (address?.is_primary) {
    await supabase
      .from('customers')
      .update({
        address_line1: null,
        address_line2: null,
        city: null,
        state: null,
        zip: null,
      })
      .eq('id', params.id)
  }

  return NextResponse.json({ success: true })
}
