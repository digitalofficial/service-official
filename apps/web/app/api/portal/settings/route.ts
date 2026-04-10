import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'

function getPortalUserId(request: NextRequest): string | null {
  const cookie = request.cookies.get('portal_session')?.value
  if (!cookie) return null
  return cookie.split(':')[0]
}

export async function POST(request: NextRequest) {
  const portalUserId = getPortalUserId(request)
  if (!portalUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const body = await request.json()
  const { action } = body

  // Get portal user + customer
  const { data: portalUser } = await supabase
    .from('portal_users')
    .select('id, customer_id, email')
    .eq('id', portalUserId)
    .eq('is_active', true)
    .single()

  if (!portalUser) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  if (action === 'get') {
    const { data: customer } = await supabase
      .from('customers')
      .select('first_name, last_name, email, phone, company_name, address_line1, city, state, zip, sms_opt_in')
      .eq('id', portalUser.customer_id)
      .single()

    return NextResponse.json({ customer })
  }

  if (action === 'update') {
    const { first_name, last_name, email, phone, company_name, address_line1, city, state, zip, sms_opt_in } = body

    const updates: Record<string, any> = {}
    if (first_name !== undefined) updates.first_name = first_name
    if (last_name !== undefined) updates.last_name = last_name
    if (email !== undefined) updates.email = email
    if (phone !== undefined) updates.phone = phone
    if (company_name !== undefined) updates.company_name = company_name
    if (address_line1 !== undefined) updates.address_line1 = address_line1
    if (city !== undefined) updates.city = city
    if (state !== undefined) updates.state = state
    if (zip !== undefined) updates.zip = zip
    if (sms_opt_in !== undefined) updates.sms_opt_in = !!sms_opt_in

    const { error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', portalUser.customer_id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    // Also update portal user email if changed
    if (email && email !== portalUser.email) {
      await supabase
        .from('portal_users')
        .update({ email: email.toLowerCase() })
        .eq('id', portalUserId)
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'delete-account') {
    // Deactivate portal user (don't delete customer record — contractor may need it)
    await supabase
      .from('portal_users')
      .update({ is_active: false, password_hash: null, magic_link_token: null })
      .eq('id', portalUserId)

    // Remove portal access from customer
    await supabase
      .from('customers')
      .update({ portal_access: false, sms_opt_in: false })
      .eq('id', portalUser.customer_id)

    // Log activity
    await supabase.from('portal_activity_log').insert({
      portal_user_id: portalUserId,
      action: 'account_deleted',
    }).catch(() => {})

    // Clear session cookie
    const response = NextResponse.json({ success: true })
    response.cookies.delete('portal_session')
    return response
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
