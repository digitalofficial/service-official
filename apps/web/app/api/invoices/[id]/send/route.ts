import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { sendEmail } from '@service-official/notifications'
import { sendOrgSms } from '@/lib/sms'
import Stripe from 'stripe'

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

  const org = invoice.organization as any

  // Create Stripe Payment Intent using per-org Stripe key
  let paymentUrl: string | undefined
  const orgStripeKey = org?.stripe_secret_key
  const hasStripe = orgStripeKey && org?.payments_enabled

  if (invoice.amount_due > 0 && hasStripe) {
    try {
      const orgStripe = new Stripe(orgStripeKey)

      const paymentIntent = await orgStripe.paymentIntents.create({
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
    } catch (err: any) {
      console.error('Stripe payment intent creation failed:', err.message)
      // Continue without payment link — invoice will still be sent
    }
  }

  // Build invoice view link (always available, even without Stripe)
  const invoiceViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}/view`

  // Send email
  if (invoice.customer?.email) {
    await sendEmail({
      to: invoice.customer.email,
      subject: `Invoice #${invoice.invoice_number} — $${invoice.total.toFixed(2)} due`,
      template: 'invoice',
      variables: {
        customer_name: `${invoice.customer.first_name ?? ''} ${invoice.customer.last_name ?? ''}`.trim(),
        company_name: org.name,
        invoice_number: invoice.invoice_number,
        total: invoice.total,
        amount_due: invoice.amount_due,
        due_date: invoice.due_date,
        payment_url: paymentUrl,
        invoice_url: invoiceViewUrl,
      },
    })
  }

  // Send SMS if customer has phone number
  if (invoice.customer?.phone) {
    const customerName = invoice.customer.first_name ?? 'there'
    const payPart = paymentUrl
      ? `Pay online: ${paymentUrl}`
      : `View invoice: ${invoiceViewUrl}`

    await sendOrgSms({
      organizationId: invoice.organization_id,
      to: invoice.customer.phone,
      body: `Hi ${customerName}! Invoice #${invoice.invoice_number} for $${invoice.amount_due.toFixed(2)} from ${org.name}. ${payPart}`,
    })
  }

  await supabase
    .from('invoices')
    .update({ status: 'sent' })
    .eq('id', params.id)

  return NextResponse.json({ success: true, payment_url: paymentUrl })
}
