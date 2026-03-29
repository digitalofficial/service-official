import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (request.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const { email, first_name, last_name, phone } = await request.json()

  if (!email || !first_name || !last_name) {
    return NextResponse.json({ error: 'Email, first name, and last name are required' }, { status: 400 })
  }

  // Verify org exists
  const { data: org } = await supabase.from('organizations').select('id, name').eq('id', params.id).single()
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  // Check if email already has an account
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .single()

  if (existingProfile) {
    // User exists — just update their role to owner for this org
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'owner', organization_id: params.id })
      .eq('id', existingProfile.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      message: `${email} promoted to owner of ${org.name}`,
      existing_user: true,
    })
  }

  // Create new auth account
  const tempPassword = `SO-${Math.random().toString(36).slice(2, 10).toUpperCase()}!`

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // Create profile with owner role
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authUser.user.id,
    organization_id: params.id,
    role: 'owner',
    first_name,
    last_name,
    email,
    phone: phone ?? null,
    is_active: true,
    notify_sms: true,
    notify_email: true,
    notify_push: true,
  })

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    message: `Owner account created for ${org.name}`,
    temp_password: tempPassword,
    email,
  })
}
