import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { sendEmail } from '@service-official/notifications'
import { sendOrgSms } from '@/lib/sms'
import { logMessage } from '@/lib/log-message'
import { trigger } from '@service-official/workflows'

// POST /api/estimates/[id]/send
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

  const { data: estimate } = await supabase
    .from('estimates')
    .select('*, customer:customers(*), organization:organizations(*)')
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)
    .single()

  if (!estimate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Parse channel preference
  let channel: 'email' | 'sms' | 'both' = 'email'
  try {
    const body = await request.json()
    if (body.channel) channel = body.channel
  } catch {
    // No body — default to email
  }

  const customer = estimate.customer as any
  const org = estimate.organization as any
  const customerName = `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim() || 'there'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const estimateUrl = `${appUrl}/portal/estimates/${params.id}`
  const results: { email?: boolean; sms?: boolean } = {}

  // Update to sent
  await supabase.from('estimates').update({ status: 'sent' }).eq('id', params.id).eq('organization_id', profile!.organization_id)

  // Send email
  if ((channel === 'email' || channel === 'both') && customer?.email) {
    const emailResult = await sendEmail({
      to: customer.email,
      subject: `Estimate #${estimate.estimate_number} from ${org.name}`,
      template: 'estimate',
      variables: {
        customer_name: customerName,
        company_name: org.name,
        estimate_number: estimate.estimate_number,
        estimate_total: estimate.total,
        estimate_url: estimateUrl,
        expiry_date: estimate.expiry_date,
      },
    })
    results.email = emailResult.success

    await logMessage({
      supabase,
      organization_id: profile!.organization_id,
      customer_id: estimate.customer_id,
      channel: 'email',
      direction: 'outbound',
      body: `Estimate #${estimate.estimate_number} for $${estimate.total.toFixed(2)} sent via email`,
      email_address: customer.email,
      sent_by: user.id,
      status: emailResult.success ? 'sent' : 'failed',
    })
  }

  // Send SMS
  if ((channel === 'sms' || channel === 'both') && customer?.phone) {
    const smsBody = `Hi ${customer.first_name ?? 'there'}! ${org.name} has sent you an estimate (#${estimate.estimate_number}) for $${estimate.total.toFixed(2)}. View it here: ${estimateUrl}`

    const smsResult = await sendOrgSms({
      organizationId: profile!.organization_id,
      to: customer.phone,
      body: smsBody,
    })
    results.sms = smsResult.success

    await logMessage({
      supabase,
      organization_id: profile!.organization_id,
      customer_id: estimate.customer_id,
      channel: 'sms',
      direction: 'outbound',
      body: smsBody,
      phone_number: customer.phone,
      sent_by: user.id,
      status: smsResult.success ? 'sent' : 'failed',
    })
  }

  trigger('estimate.sent')(
    profile!.organization_id, 'estimate', params.id,
    { estimate_number: estimate.estimate_number, total: estimate.total }
  )

  return NextResponse.json({ success: true, channels: results })
}
