import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { sendSMS } from '@service-official/notifications'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const { searchParams } = new URL(request.url)
  const customer_id = searchParams.get('customer_id')
  const project_id = searchParams.get('project_id')

  let query = supabase
    .from('conversations')
    .select(`
      *,
      customer:customers(id, first_name, last_name, company_name, phone),
      messages(id, body, direction, sent_at, status, read_at)
    `)
    .eq('organization_id', profile!.organization_id)
    .eq('is_archived', false)
    .order('last_message_at', { ascending: false })

  if (customer_id) query = query.eq('customer_id', customer_id)
  if (project_id) query = query.eq('project_id', project_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const { conversation_id, customer_id, body, channel = 'sms', media_urls = [] } = await request.json()

  // Get or create conversation
  let convoId = conversation_id
  let phoneNumber: string | undefined

  if (!convoId && customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('phone')
      .eq('id', customer_id)
      .single()

    phoneNumber = customer?.phone

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('customer_id', customer_id)
      .eq('channel', channel)
      .single()

    if (existing) {
      convoId = existing.id
    } else {
      const { data: newConvo } = await supabase
        .from('conversations')
        .insert({
          organization_id: profile!.organization_id,
          customer_id,
          channel,
          phone_number: phoneNumber,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()
      convoId = newConvo!.id
    }
  }

  if (!convoId) return NextResponse.json({ error: 'conversation_id or customer_id required' }, { status: 400 })

  // Get phone number from conversation if not already set
  if (!phoneNumber) {
    const { data: convo } = await supabase.from('conversations').select('phone_number').eq('id', convoId).single()
    phoneNumber = convo?.phone_number
  }

  // Send SMS via Twilio
  let twilioSid: string | undefined
  if (channel === 'sms' && phoneNumber) {
    const result = await sendSMS({ to: phoneNumber, body, media_urls })
    if (result.success) twilioSid = result.sid
  }

  // Save message
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: convoId,
      organization_id: profile!.organization_id,
      direction: 'outbound',
      channel,
      body,
      twilio_sid: twilioSid,
      status: twilioSid ? 'sent' : 'failed',
      media_urls,
      sent_by: user.id,
    })
    .select()
    .single()

  // Update conversation timestamp
  await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', convoId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: message, success: true }, { status: 201 })
}
