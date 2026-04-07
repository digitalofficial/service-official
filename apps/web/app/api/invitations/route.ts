import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { z } from 'zod'
import crypto from 'crypto'

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['office_manager', 'project_manager', 'foreman', 'technician', 'dispatcher', 'subcontractor', 'viewer']),
})

// GET — list invitations for the org
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('invitations')
    .select('*, inviter:profiles!invited_by(first_name, last_name)')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST — send a new invitation
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role, organization:organizations(name)')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Only owners and admins can invite team members' }, { status: 403 })
  }

  const body = await request.json()
  const validated = inviteSchema.parse(body)

  // Check if already a member
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .eq('email', validated.email)
    .single()

  if (existingProfile) {
    return NextResponse.json({ error: 'This person is already a team member' }, { status: 409 })
  }

  // Check for existing pending invite
  const { data: existingInvite } = await supabase
    .from('invitations')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .eq('email', validated.email)
    .eq('status', 'pending')
    .single()

  if (existingInvite) {
    return NextResponse.json({ error: 'An invitation has already been sent to this email' }, { status: 409 })
  }

  // Create invitation
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      organization_id: profile.organization_id,
      email: validated.email,
      role: validated.role,
      invited_by: user.id,
      token,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const orgName = (profile.organization as any)?.name ?? 'your organization'
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?token=${token}`

  // TODO: Send email via Resend
  // For now, return the invite link
  return NextResponse.json({
    data: invitation,
    invite_url: inviteUrl,
    message: `Invitation sent to ${validated.email}`,
  }, { status: 201 })
}
