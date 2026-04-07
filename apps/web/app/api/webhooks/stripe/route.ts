import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceRoleClient } from '@service-official/database'

// Global Stripe client for webhook signature verification
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent
      const { invoice_id, organization_id } = intent.metadata

      if (invoice_id) {
        // Update payment status
        await supabase
          .from('payments')
          .update({ status: 'succeeded' })
          .eq('stripe_payment_intent_id', intent.id)

        // Get invoice total
        const { data: invoice } = await supabase
          .from('invoices')
          .select('*, customer:customers(first_name, last_name, company_name)')
          .eq('id', invoice_id)
          .single()

        if (invoice) {
          const newPaid = (invoice.amount_paid ?? 0) + intent.amount / 100
          const isPaidInFull = newPaid >= invoice.total

          await supabase.from('invoices').update({
            amount_paid: newPaid,
            amount_due: Math.max(0, invoice.total - newPaid),
            status: isPaidInFull ? 'paid' : 'partial',
            paid_at: isPaidInFull ? new Date().toISOString() : undefined,
          }).eq('id', invoice_id)

          // Notify org owners/admins
          const { data: owners } = await supabase
            .from('profiles')
            .select('id')
            .eq('organization_id', organization_id)
            .in('role', ['owner', 'admin', 'office_manager'])

          if (owners) {
            await supabase.from('notifications').insert(owners.map(o => ({
              organization_id,
              user_id: o.id,
              type: 'payment_received',
              title: `Payment received — $${(intent.amount / 100).toFixed(2)}`,
              body: `Invoice #${invoice.invoice_number} payment received`,
              entity_type: 'invoice',
              entity_id: invoice_id,
              action_url: `/invoices/${invoice_id}`,
              channels: ['in_app', 'push'],
            })))
          }
        }
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('stripe_payment_intent_id', intent.id)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const tier = (sub.metadata.tier ?? 'solo') as any

      await supabase.from('organizations').update({
        subscription_tier: tier,
        subscription_status: sub.status as any,
        stripe_subscription_id: sub.id,
      }).eq('stripe_customer_id', sub.customer as string)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('organizations').update({
        subscription_status: 'canceled',
      }).eq('stripe_subscription_id', sub.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
