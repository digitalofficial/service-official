import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { sendEmail } from '@service-official/notifications'
import { sendOrgSms } from '@/lib/sms'
import { logMessage } from '@/lib/log-message'
import Stripe from 'stripe'

// POST /api/invoices/[id]/send
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, customer:customers(*), organization:organizations(*)')
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Parse channel preference from request body
  let channel: 'email' | 'sms' | 'both' = 'both'
  try {
    const body = await request.json()
    if (body.channel) channel = body.channel
  } catch {
    // No body sent — default to 'both'
  }

  const org = invoice.organization as any
  const customer = invoice.customer as any
  const customerName = `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim() || 'there'

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
    }
  }

  const invoiceViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/public/portal/invoices/${invoice.id}`
  const results: { email?: boolean; sms?: boolean } = {}

  // Send email
  if ((channel === 'email' || channel === 'both') && customer?.email) {
    const emailResult = await sendEmail({
      to: customer.email,
      subject: `Invoice #${invoice.invoice_number} — $${invoice.total.toFixed(2)} due`,
      template: 'invoice',
      variables: {
        customer_name: customerName,
        company_name: org.name,
        invoice_number: invoice.invoice_number,
        total: invoice.total,
        amount_due: invoice.amount_due,
        due_date: invoice.due_date,
        payment_url: paymentUrl,
        invoice_url: invoiceViewUrl,
      },
    })
    results.email = emailResult.success

    // Log to messages
    await logMessage({
      supabase,
      organization_id: invoice.organization_id,
      customer_id: invoice.customer_id,
      channel: 'email',
      direction: 'outbound',
      body: `Invoice #${invoice.invoice_number} for $${invoice.amount_due.toFixed(2)} sent via email`,
      email_address: customer.email,
      sent_by: user.id,
      status: emailResult.success ? 'sent' : 'failed',
    })
  }

  // Send SMS
  if ((channel === 'sms' || channel === 'both') && customer?.phone) {
    const payPart = paymentUrl
      ? `Pay online: ${paymentUrl}`
      : `View invoice: ${invoiceViewUrl}`

    const smsBody = `Hi ${customer.first_name ?? 'there'}! Invoice #${invoice.invoice_number} for $${invoice.amount_due.toFixed(2)} from ${org.name}. ${payPart}`

    const smsResult = await sendOrgSms({
      organizationId: invoice.organization_id,
      to: customer.phone,
      body: smsBody,
    })
    results.sms = smsResult.success

    // Log to messages
    await logMessage({
      supabase,
      organization_id: invoice.organization_id,
      customer_id: invoice.customer_id,
      channel: 'sms',
      direction: 'outbound',
      body: smsBody,
      phone_number: customer.phone,
      sent_by: user.id,
      status: smsResult.success ? 'sent' : 'failed',
    })
  }

  await supabase
    .from('invoices')
    .update({ status: 'sent' })
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)

  return NextResponse.json({ success: true, payment_url: paymentUrl, channels: results })
}
