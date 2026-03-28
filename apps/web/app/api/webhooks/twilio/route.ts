import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { notifyTeam } from '@service-official/notifications'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const supabase = createServiceRoleClient()

  const From = formData.get('From') as string
  const Body = formData.get('Body') as string
  const MessageSid = formData.get('MessageSid') as string
  const NumMedia = Number(formData.get('NumMedia') ?? 0)

  const mediaUrls: string[] = []
  for (let i = 0; i < NumMedia; i++) {
    const url = formData.get(`MediaUrl${i}`) as string
    if (url) mediaUrls.push(url)
  }

  // Find customer by phone number
  // Note: normalize phone numbers in production
  const { data: customer } = await supabase
    .from('customers')
    .select('id, organization_id, first_name, last_name, company_name')
    .eq('phone', From)
    .single()

  // Find or create conversation
  let conversationId: string

  if (customer) {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('channel', 'sms')
      .single()

    if (existing) {
      conversationId = existing.id
      await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      const { data: newConvo } = await supabase
        .from('conversations')
        .insert({
          organization_id: customer.organization_id,
          customer_id: customer.id,
          channel: 'sms',
          phone_number: From,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()
      conversationId = newConvo!.id
    }

    // Save message
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      organization_id: customer.organization_id,
      direction: 'inbound',
      channel: 'sms',
      body: Body,
      twilio_sid: MessageSid,
      status: 'delivered',
      media_urls: mediaUrls,
    })

    // Notify team
    await notifyTeam({
      organization_id: customer.organization_id,
      roles: ['owner', 'admin', 'office_manager'],
      type: 'message_received',
      title: `Message from ${customer.first_name ?? customer.company_name}`,
      body: Body.slice(0, 100),
      entity_type: 'conversation',
      entity_id: conversationId,
      action_url: `/messages/${conversationId}`,
      channels: ['in_app', 'push'],
    })
  }

  // Twilio expects TwiML response
  return new NextResponse('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  })
}
