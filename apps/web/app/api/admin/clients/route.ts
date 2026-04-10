import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { sendEmail } from '@service-official/notifications'
import { z } from 'zod'

const schema = z.object({
  company_name: z.string().min(1),
  industry: z.string().default('general_contractor'),
  domain: z.string().min(1),
  owner_email: z.string().email(),
  owner_first_name: z.string(),
  owner_last_name: z.string(),
  owner_phone: z.string().optional(),
  subscription_tier: z.enum(['solo', 'team', 'growth', 'enterprise']).default('solo'),
})

async function addVercelDomain(domain: string): Promise<{ success: boolean; error?: string }> {
  const token = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID

  if (!token || !projectId) {
    return { success: false, error: 'Vercel API not configured' }
  }

  try {
    const url = `https://api.vercel.com/v10/projects/${projectId}/domains${teamId ? `?teamId=${teamId}` : ''}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    })

    const data = await res.json()

    if (!res.ok) {
      // Domain might already be added — that's fine
      if (data.error?.code === 'domain_already_in_use' || data.error?.code === 'DOMAIN_ALREADY_IN_USE') {
        return { success: true }
      }
      return { success: false, error: data.error?.message ?? 'Failed to add domain to Vercel' }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

async function addSupabaseRedirect(domain: string): Promise<void> {
  // Supabase Management API to add redirect URL would go here
  // For now this is a manual step — noted in instructions
}

export async function POST(request: NextRequest) {
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

  // Register their domain in DB
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

  // Auto-add domain to Vercel
  const vercelResult = await addVercelDomain(data.domain)

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
  const loginUrl = `https://${data.domain}`
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

  // Parse the subdomain and root domain for DNS instructions
  const domainParts = data.domain.split('.')
  const subdomain = domainParts[0] // e.g. "service"
  const rootDomain = domainParts.slice(1).join('.') // e.g. "theplatinumbuildersllc.com"

  // Build setup steps
  const steps = []

  // DNS step
  steps.push({
    title: 'Add DNS Record',
    where: `Cloudflare (or DNS provider) for ${rootDomain}`,
    action: 'Add CNAME record',
    details: {
      type: 'CNAME',
      name: subdomain,
      target: 'cname.vercel-dns.com',
      proxy: 'OFF (grey cloud in Cloudflare)',
      ttl: 'Auto',
    },
  })

  // Vercel domain step
  if (vercelResult.success) {
    steps.push({
      title: 'Vercel Domain',
      where: 'Auto-configured',
      action: `${data.domain} has been added to Vercel automatically`,
      status: 'done',
    })
  } else {
    steps.push({
      title: 'Add Domain to Vercel (manual)',
      where: 'Vercel Dashboard → Settings → Domains',
      action: `Add ${data.domain}`,
      error: vercelResult.error,
    })
  }

  // Supabase step
  steps.push({
    title: 'Add Supabase Redirect URL',
    where: 'Supabase Dashboard → Auth → URL Configuration → Redirect URLs',
    action: `Add https://${data.domain}/**`,
  })

  // Credentials step
  steps.push({
    title: 'Login Credentials Sent',
    where: `Email to ${data.owner_email}`,
    action: emailResult.success
      ? 'Welcome email sent automatically with login URL and temporary password'
      : `Failed to send email — share credentials manually: ${tempPassword}`,
    status: emailResult.success ? 'done' : 'manual',
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
    dns: {
      type: 'CNAME',
      name: subdomain,
      target: 'cname.vercel-dns.com',
      root_domain: rootDomain,
      proxy: 'OFF',
    },
    email_sent: emailResult.success,
    vercel_domain: vercelResult,
    setup_steps: steps,
    instructions: [
      `1. DNS: In ${rootDomain} Cloudflare → Add CNAME: ${subdomain} → cname.vercel-dns.com (proxy OFF)`,
      vercelResult.success
        ? `2. Vercel: ✅ Domain ${data.domain} added automatically`
        : `2. Vercel: Add ${data.domain} in Settings → Domains`,
      `3. Supabase: Add https://${data.domain}/** to Auth → Redirect URLs`,
      emailResult.success
        ? `4. ✅ Welcome email sent to ${data.owner_email} with login credentials`
        : `4. ⚠️ Email failed — manually send credentials to ${data.owner_email}: ${tempPassword}`,
      `5. They log in at https://${data.domain}`,
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
