import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@service-official/notifications'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST — submit a support ticket
export async function POST(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', profile.organization_id)
    .single()

  const body = await request.json()
  const { subject, message, priority } = body

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
  }

  const serviceClient = getServiceClient()

  // Store the ticket
  const { data: ticket, error } = await serviceClient
    .from('support_tickets')
    .insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      user_email: profile.email,
      user_name: `${profile.first_name} ${profile.last_name}`,
      org_name: org?.name ?? 'Unknown',
      subject: subject.trim(),
      message: message.trim(),
      priority: priority || 'normal',
      status: 'open',
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create support ticket:', error)
    return NextResponse.json({ error: 'Failed to submit ticket' }, { status: 500 })
  }

  // Send email notification to support
  try {
    await sendEmail({
      to: 'support@serviceofficial.app',
      subject: `[Support Ticket] ${subject} — ${org?.name ?? 'Unknown'}`,
      template: 'default',
      variables: {
        title: `New Support Ticket`,
        body: `
          <strong>From:</strong> ${profile.first_name} ${profile.last_name} (${profile.email})<br/>
          <strong>Company:</strong> ${org?.name ?? 'Unknown'}<br/>
          <strong>Priority:</strong> ${priority || 'normal'}<br/>
          <strong>Subject:</strong> ${subject}<br/><br/>
          <strong>Message:</strong><br/>
          ${message.replace(/\n/g, '<br/>')}
        `,
        company_name: 'Service Official',
      },
    })
  } catch (err) {
    console.error('Failed to send support email:', err)
  }

  return NextResponse.json({ success: true, ticket_id: ticket.id })
}

// GET — list tickets (admin only)
export async function GET(request: NextRequest) {
  if (request.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = getServiceClient()

  const { data: tickets, error } = await serviceClient
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: tickets })
}
