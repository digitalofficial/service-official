import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { sendEmail } from '@service-official/notifications'
import { z } from 'zod'

const schema = z.object({
  company_name: z.string().min(1),
  industry: z.string().default('general_contractor'),
  owner_email: z.string().email(),
  owner_first_name: z.string(),
  owner_last_name: z.string(),
  owner_phone: z.string().optional(),
  subscription_tier: z.enum(['solo', 'team', 'growth', 'enterprise']).default('solo'),
})

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const body = await request.json()
  const data = schema.parse(body)

  // Generate slug from company name
  const slug = data.company_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+$/, '')

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: data.company_name,
      slug,
      industry: data.industry,
      subscription_tier: data.subscription_tier,
      subscription_status: 'trialing',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single()

  if (orgError) return NextResponse.json({ error: orgError.message }, { status: 500 })

  // Create owner auth account with temp password
  const tempPassword = `SO-${Math.random().toString(36).slice(2, 10).toUpperCase()}!`

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: data.owner_email,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // Create profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authUser.user.id,
    organization_id: org.id,
    role: 'owner',
    first_name: data.owner_first_name,
    last_name: data.owner_last_name,
    email: data.owner_email,
    phone: data.owner_phone,
  })

  if (profileError) return NextResponse.json({ error: `Profile creation failed: ${profileError.message}` }, { status: 500 })

  // Send welcome email with login credentials
  const loginUrl = 'https://serviceofficial.app'
  const emailResult = await sendEmail({
    to: data.owner_email,
    subject: `Your ${data.company_name} account is ready — Service Official`,
    template: 'welcome',
    variables: {
      company_name: data.company_name,
      first_name: data.owner_first_name || 'there',
      login_url: loginUrl,
      email: data.owner_email,
      temp_password: tempPassword,
      trial_days: 14,
    },
  })

  return NextResponse.json({
    success: true,
    client: {
      organization_id: org.id,
      company_name: org.name,
      app_url: loginUrl,
      login_email: data.owner_email,
      temp_password: tempPassword,
    },
    email_sent: emailResult.success,
  }, { status: 201 })
}

// GET — list all clients
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, industry, subscription_tier, subscription_status, trial_ends_at, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: data.length })
}
