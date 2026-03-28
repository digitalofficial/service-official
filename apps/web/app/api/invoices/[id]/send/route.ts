import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { sendEmail } from '@service-official/notifications'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// POST /api/invoices/[id]/send
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, customer:customers(*), organization:organizations(*)')
    .eq('id', params.id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Create Stripe Payment Intent
  let paymentUrl: string | undefined
  if (invoice.amount_due > 0) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(invoice.amount_due * 100),
      currency: 'usd',
      metadata: {
        invoice_id: invoice.id,
        organization_id: invoice.organization_id,
        invoice_number: invoice.invoice_number ?? '',
      },
    })

    // Save to payments table
    await supabase.from('payments').insert({
      organization_id: invoice.organization_id,
      invoice_id: invoice.id,
      customer_id: invoice.customer_id,
      amount: invoice.amount_due,
      currency: 'usd',
      status: 'pending',
      stripe_payment_intent_id: paymentIntent.id,
    })

    paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${paymentIntent.id}`
  }

  // Send email
  if (invoice.customer?.email) {
    await sendEmail({
      to: invoice.customer.email,
      subject: `Invoice #${invoice.invoice_number} — $${invoice.total.toFixed(2)} due`,
      template: 'invoice',
      variables: {
        customer_name: `${invoice.customer.first_name ?? ''} ${invoice.customer.last_name ?? ''}`.trim(),
        company_name: invoice.organization.name,
        invoice_number: invoice.invoice_number,
        total: invoice.total,
        amount_due: invoice.amount_due,
        due_date: invoice.due_date,
        payment_url: paymentUrl,
      },
    })
  }

  await supabase
    .from('invoices')
    .update({ status: 'sent' })
    .eq('id', params.id)

  return NextResponse.json({ success: true, payment_url: paymentUrl })
}
