import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  company_name: z.string().min(1),
  industry: z.string().default('other'),
  phone: z.string().optional(),
})

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid input' }, { status: 400 })
    }

    const data = parsed.data
    const supabase = getServiceClient()

    // 1. Create auth user — Supabase rejects if email already exists
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        first_name: data.first_name,
        last_name: data.last_name,
        company_name: data.company_name,
        industry: data.industry,
        phone: data.phone,
      },
    })

    if (authError) {
      const msg = authError.message.toLowerCase()
      if (msg.includes('already') || msg.includes('duplicate') || msg.includes('exists')) {
        return NextResponse.json({ error: 'An account with this email already exists. Try signing in instead.' }, { status: 409 })
      }
      console.error('Auth creation error:', authError)
      return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 400 })
    }

    // 3. Create organization with 14-day trial
    const base = data.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const slug = `${base}-${Date.now().toString(36)}`

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: data.company_name,
        slug,
        industry: data.industry,
        phone: data.phone || null,
        timezone: 'America/Denver',
        currency: 'USD',
        primary_color: '#2563eb',
        secondary_color: '#1e3a5f',
        subscription_tier: 'solo',
        subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        settings: {},
      })
      .select()
      .single()

    if (orgError) {
      console.error('Org creation error:', orgError)
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Failed to set up your company. Please try again.' }, { status: 500 })
    }

    // 4. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        organization_id: org.id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || null,
        role: 'owner',
        is_active: true,
        notify_sms: true,
        notify_email: true,
        notify_push: true,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      await supabase.auth.admin.deleteUser(authData.user.id)
      await supabase.from('organizations').delete().eq('id', org.id)
      return NextResponse.json({ error: 'Failed to set up your profile. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user_id: authData.user.id,
      organization_id: org.id,
    }, { status: 201 })
  } catch (err: any) {
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
