import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { z } from 'zod'

const schema = z.object({
  // Client organization
  company_name: z.string().min(1),
  industry: z.string().default('general_contractor'),
  domain: z.string().min(1), // e.g. service.smithroofing.com
  // Owner account
  owner_email: z.string().email(),
  owner_first_name: z.string(),
  owner_last_name: z.string(),
  owner_phone: z.string().optional(),
  // Plan
  subscription_tier: z.enum(['solo', 'team', 'growth', 'enterprise']).default('solo'),
})

export async function POST(request: NextRequest) {
  // Protect with admin secret
  const secret = request.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const body = await request.json()
  const data = schema.parse(body)

  // Check domain not already taken
  const { data: existingDomain } = await supabase
    .from('organization_domains')
    .select('id')
    .eq('domain', data.domain)
    .single()

  if (existingDomain) {
    return NextResponse.json({ error: 'Domain already registered' }, { status: 409 })
  }

  // Generate slug from domain
  const slug = data.domain
    .replace(/^service\./, '')
    .replace(/\./g, '-')
    .toLowerCase()

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

  // Register their domain
  const { error: domainError } = await supabase
    .from('organization_domains')
    .insert({
      organization_id: org.id,
      domain: data.domain,
      is_primary: true,
      is_verified: true,
      verified_at: new Date().toISOString(),
    })

  if (domainError) return NextResponse.json({ error: domainError.message }, { status: 500 })

  // Create owner auth account with temp password
  const tempPassword = `SO-${Math.random().toString(36).slice(2, 10).toUpperCase()}!`

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: data.owner_email,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // Create profile
  await supabase.from('profiles').insert({
    id: authUser.user.id,
    organization_id: org.id,
    role: 'owner',
    first_name: data.owner_first_name,
    last_name: data.owner_last_name,
    email: data.owner_email,
    phone: data.owner_phone,
  })

  return NextResponse.json({
    success: true,
    client: {
      organization_id: org.id,
      company_name: org.name,
      app_url: `https://${data.domain}`,
      login_email: data.owner_email,
      temp_password: tempPassword,
    },
    instructions: [
      `1. In their Cloudflare: Add CNAME record — Name: service, Target: cname.vercel-dns.com, Proxy: OFF`,
      `2. In Vercel: Settings → Domains → Add → ${data.domain}`,
      `3. Send credentials to ${data.owner_email}`,
      `4. They log in at https://${data.domain}`,
    ],
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
    .from('organization_domains')
    .select(`
      domain,
      is_verified,
      created_at,
      organization:organizations(id, name, slug, subscription_tier, subscription_status)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: data.length })
}
