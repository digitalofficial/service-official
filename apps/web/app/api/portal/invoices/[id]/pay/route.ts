import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { getPortalUserWithPermissions } from '@/lib/portal/permissions'
import Stripe from 'stripe'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getPortalUserWithPermissions(request)
  if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { portalUser, permissions } = result
  if (!permissions.pay_invoices) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const supabase = createServerSupabaseClient()

  // Fetch invoice scoped to this customer
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, organization:organizations(stripe_secret_key, payments_enabled)')
    .eq('id', params.id)
    .eq('customer_id', portalUser.customer_id)
    .eq('organization_id', portalUser.organization_id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const org = invoice.organization as any
  if (!org?.payments_enabled || !org?.stripe_secret_key) {
    return NextResponse.json({ error: 'Payments not enabled' }, { status: 400 })
  }

  if (invoice.amount_due <= 0) {
    return NextResponse.json({ error: 'No amount due' }, { status: 400 })
  }

  // Check for existing pending payment
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('stripe_payment_intent_id')
    .eq('invoice_id', params.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingPayment?.stripe_payment_intent_id) {
    return NextResponse.json({ payment_intent_id: existingPayment.stripe_payment_intent_id })
  }

  // Create new Stripe Payment Intent
  try {
    const orgStripe = new Stripe(org.stripe_secret_key)

    const paymentIntent = await orgStripe.paymentIntents.create({
      amount: Math.round(invoice.amount_due * 100),
      currency: 'usd',
      metadata: {
        invoice_id: invoice.id,
        organization_id: invoice.organization_id,
        invoice_number: invoice.invoice_number ?? '',
      },
    })

    await supabase.from('payments').insert({
      organization_id: invoice.organization_id,
      invoice_id: invoice.id,
      customer_id: invoice.customer_id,
      amount: invoice.amount_due,
      currency: 'usd',
      status: 'pending',
      stripe_payment_intent_id: paymentIntent.id,
    })

    return NextResponse.json({ payment_intent_id: paymentIntent.id })
  } catch (err: any) {
    console.error('Stripe payment intent creation failed:', err.message)
    return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 })
  }
}
