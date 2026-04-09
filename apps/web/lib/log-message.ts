import { SupabaseClient } from '@supabase/supabase-js'

interface LogMessageOptions {
  supabase: SupabaseClient
  organization_id: string
  customer_id: string
  channel: 'sms' | 'email'
  direction: 'inbound' | 'outbound'
  body: string
  phone_number?: string
  email_address?: string
  sent_by?: string
  status?: string
  metadata?: Record<string, unknown>
}

/**
 * Logs a message to the conversations/messages tables.
 * Creates or finds an existing conversation for the customer + channel.
 */
export async function logMessage(options: LogMessageOptions) {
  const {
    supabase,
    organization_id,
    customer_id,
    channel,
    direction,
    body,
    phone_number,
    email_address,
    sent_by,
    status = 'sent',
  } = options

  // Find or create conversation for this customer + channel
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('organization_id', organization_id)
    .eq('customer_id', customer_id)
    .eq('channel', channel)
    .single()

  let conversationId: string

  if (existing) {
    conversationId = existing.id
  } else {
    const { data: newConvo } = await supabase
      .from('conversations')
      .insert({
        organization_id,
        customer_id,
        channel,
        phone_number: channel === 'sms' ? phone_number : undefined,
        email_address: channel === 'email' ? email_address : undefined,
        last_message_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (!newConvo) return null
    conversationId = newConvo.id
  }

  // Insert the message
  const { data: message } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      organization_id,
      direction,
      channel,
      body,
      status,
      sent_by,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single()

  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  return message
}
