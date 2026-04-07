import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import Stripe from 'stripe'

// GET /api/pay/[id] — returns client_secret for a payment intent (public route)
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const paymentIntentId = params.id
  const supabase = createServiceRoleClient()

  // Look up payment record
  const { data: payment, error } = await supabase
    .from('payments')
    .select('organization_id, status')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single()

  if (!payment || error) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  if (payment.status === 'succeeded') {
    return NextResponse.json({ error: 'Payment already completed' }, { status: 400 })
  }

  // Get org's Stripe secret key
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_secret_key, payments_enabled')
    .eq('id', payment.organization_id)
    .single()

  if (!org?.stripe_secret_key || !org.payments_enabled) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 400 })
  }

  // Retrieve payment intent from Stripe using the org's key
  const stripe = new Stripe(org.stripe_secret_key)

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return NextResponse.json({ client_secret: paymentIntent.client_secret })
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve payment details' }, { status: 500 })
  }
}
