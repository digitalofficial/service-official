import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { z } from 'zod'

const schema = z.object({
  // Organization
  name: z.string().min(1),
  slug: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
  industry: z.string().default('general_contractor'),
  // Owner account
  owner_email: z.string().email(),
  owner_first_name: z.string(),
  owner_last_name: z.string(),
  owner_password: z.string().min(8),
  // Plan
  subscription_tier: z.enum(['solo', 'team', 'growth', 'enterprise']).default('solo'),
})

export async function POST(request: NextRequest) {
  try {
    // Verify this is called from your admin panel (add your own secret)
    const adminSecret = request.headers.get('x-admin-secret')
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()
    const body = await request.json()
    const data = schema.parse(body)

    // Check slug is available
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', data.slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Subdomain already taken' }, { status: 409 })
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: data.name,
        slug: data.slug,
        industry: data.industry,
        subscription_tier: data.subscription_tier,
        subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      })
      .select()
      .single()

    if (orgError) throw orgError

    // Create owner auth account
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: data.owner_email,
      password: data.owner_password,
      email_confirm: true,
    })

    if (authError) throw authError

    // Create owner profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        organization_id: org.id,
        role: 'owner',
        first_name: data.owner_first_name,
        last_name: data.owner_last_name,
        email: data.owner_email,
      })

    if (profileError) throw profileError

    const appDomain = process.env.APP_ROOT_DOMAIN ?? 'serviceofficial.com'

    return NextResponse.json({
      success: true,
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        url: `https://${org.slug}.${appDomain}`,
      },
      owner: {
        id: authUser.user.id,
        email: data.owner_email,
      },
      next_steps: [
        `Add CNAME: ${data.slug} → cname.vercel-dns.com in Cloudflare`,
        `Add domain ${data.slug}.${appDomain} in Vercel`,
        `Send login credentials to ${data.owner_email}`,
      ],
    }, { status: 201 })

  } catch (error: any) {
    console.error('Onboarding error:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
