import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { getPortalUserWithPermissions } from '@/lib/portal/permissions'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getPortalUserWithPermissions(request)
  if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { portalUser, permissions } = result
  if (!permissions.view_invoices) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const supabase = createServerSupabaseClient()

  // Fetch invoice scoped to this customer
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, customer:customers(*)')
    .eq('id', params.id)
    .eq('customer_id', portalUser.customer_id)
    .eq('organization_id', portalUser.organization_id)
    .single()

  if (!invoice || error) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch line items
  const { data: lineItems } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', params.id)
    .order('order_index', { ascending: true })

  // Fetch organization for branding
  const { data: organization } = await supabase
    .from('organizations')
    .select('name, logo_url, primary_color, secondary_color, phone, email, address_line1, city, state, zip, license_number, payments_enabled')
    .eq('id', portalUser.organization_id)
    .single()

  // Fetch payments for this invoice
  let payments: any[] = []
  if (permissions.view_payment_history) {
    const { data } = await supabase
      .from('payments')
      .select('id, amount, status, method, created_at, stripe_payment_intent_id')
      .eq('invoice_id', params.id)
      .eq('customer_id', portalUser.customer_id)
      .order('created_at', { ascending: false })
    payments = data ?? []
  }

  // Fetch latest pending payment for Pay Now button
  const { data: pendingPayment } = await supabase
    .from('payments')
    .select('stripe_payment_intent_id, status')
    .eq('invoice_id', params.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    invoice,
    lineItems: lineItems ?? [],
    organization,
    payments,
    pendingPayment,
    permissions,
  })
}
