import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { z } from 'zod'

const schema = z.object({
  token: z.string(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient()
  const body = await request.json()
  const { token, password, first_name, last_name } = schema.parse(body)

  // Look up the invitation
  const { data: invitation, error: invError } = await supabase
    .from('invitations')
    .select('*, organization:organizations(name)')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (invError || !invitation) {
    return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
  }

  // Check expiry
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase.from('invitations').update({ status: 'expired' }).eq('id', invitation.id)
    return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 })
  }

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
  })

  if (authError) {
    // If user already exists, try to link them
    if (authError.message.includes('already been registered')) {
      return NextResponse.json({ error: 'An account with this email already exists. Please log in instead.' }, { status: 409 })
    }
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authUser.user.id,
      organization_id: invitation.organization_id,
      role: invitation.role,
      first_name,
      last_name,
      email: invitation.email,
      is_active: true,
      notify_sms: true,
      notify_email: true,
      notify_push: true,
    })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Mark invitation as accepted
  await supabase
    .from('invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  return NextResponse.json({
    success: true,
    message: 'Account created. You can now sign in.',
    organization: (invitation as any).organization?.name,
  })
}
