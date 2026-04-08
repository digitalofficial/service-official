import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

// GET /api/team/messages — list team messages
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  const { searchParams } = new URL(request.url)
  const with_user = searchParams.get('with') // specific user conversation
  const unread_only = searchParams.get('unread_only') === 'true'

  let query = supabase
    .from('team_messages')
    .select(`
      *,
      sender:profiles!sender_id(id, first_name, last_name, avatar_url, role),
      recipient:profiles!recipient_id(id, first_name, last_name, avatar_url, role)
    `)
    .eq('organization_id', profile!.organization_id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (with_user) {
    // Get conversation between current user and specific user
    query = query.or(`and(sender_id.eq.${user.id},recipient_id.eq.${with_user}),and(sender_id.eq.${with_user},recipient_id.eq.${user.id})`)
  } else {
    // Get all messages for this user (sent to them, sent by them, or broadcasts)
    query = query.or(`recipient_id.eq.${user.id},recipient_id.is.null,sender_id.eq.${user.id}`)
  }

  if (unread_only) {
    query = query.eq('is_read', false).neq('sender_id', user.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also get team members list for the compose UI
  const { data: members } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, phone, role, avatar_url, push_token, is_active')
    .eq('organization_id', profile!.organization_id)
    .eq('is_active', true)
    .order('first_name')

  // Get unread count
  const { count: unreadCount } = await supabase
    .from('team_messages')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile!.organization_id)
    .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
    .eq('is_read', false)
    .neq('sender_id', user.id)

  return NextResponse.json({ data, members, unread_count: unreadCount ?? 0 })
}

// POST /api/team/messages — send internal message
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role, first_name, last_name, push_token')
    .eq('id', user.id)
    .single()

  const body = await request.json()
  const { recipient_ids, message, job_id, project_id } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const senderName = `${profile!.first_name} ${profile!.last_name}`
  const messagesToInsert: any[] = []
  const isBroadcast = !recipient_ids || recipient_ids.includes('all')

  if (isBroadcast) {
    // Broadcast: recipient_id = null
    messagesToInsert.push({
      organization_id: profile!.organization_id,
      sender_id: user.id,
      recipient_id: null,
      body: message.trim(),
      job_id: job_id ?? null,
      project_id: project_id ?? null,
    })
  } else {
    // Individual messages
    for (const rid of recipient_ids) {
      messagesToInsert.push({
        organization_id: profile!.organization_id,
        sender_id: user.id,
        recipient_id: rid,
        body: message.trim(),
        job_id: job_id ?? null,
        project_id: project_id ?? null,
      })
    }
  }

  const { data: inserted, error } = await supabase
    .from('team_messages')
    .insert(messagesToInsert)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send push notifications to recipients
  let pushSent = 0
  const recipientQuery = isBroadcast
    ? supabase
        .from('profiles')
        .select('id, push_token')
        .eq('organization_id', profile!.organization_id)
        .eq('is_active', true)
        .neq('id', user.id)
        .not('push_token', 'is', null)
    : supabase
        .from('profiles')
        .select('id, push_token')
        .in('id', recipient_ids)
        .not('push_token', 'is', null)

  const { data: pushRecipients } = await recipientQuery

  if (pushRecipients?.length) {
    const pushMessages = pushRecipients.map(r => ({
      to: r.push_token,
      title: isBroadcast ? `Team Broadcast from ${senderName}` : `Message from ${senderName}`,
      body: message.trim().substring(0, 200),
      sound: 'default' as const,
      badge: 1,
      data: { type: 'team_message', sender_id: user.id },
    }))

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pushMessages),
      })
      if (res.ok) pushSent = pushMessages.length
    } catch {}
  }

  return NextResponse.json({
    success: true,
    messages_created: inserted?.length ?? 0,
    push_sent: pushSent,
  })
}

// PATCH /api/team/messages — mark messages as read
export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { message_ids, mark_all } = body

  if (mark_all) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    await supabase
      .from('team_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('organization_id', profile!.organization_id)
      .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
      .eq('is_read', false)
      .neq('sender_id', user.id)
  } else if (message_ids?.length) {
    await supabase
      .from('team_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', message_ids)
  }

  return NextResponse.json({ success: true })
}
