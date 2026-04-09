import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { randomBytes, createHash, scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { getPortalPermissions } from '@/lib/portal/permissions'

const scryptAsync = promisify(scrypt)

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt}:${derived.toString('hex')}`
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(':')
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  return timingSafeEqual(Buffer.from(key, 'hex'), derived)
}

// POST /api/portal/auth — magic link or verify
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const body = await request.json()
  const { action } = body

  if (action === 'magic-link') {
    const { email } = body
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    // Find portal user
    const { data: portalUser } = await supabase
      .from('portal_users')
      .select('*, customer:customers(*, organization:organizations(name, primary_color, logo_url))')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!portalUser) {
      // Don't reveal if user exists
      return NextResponse.json({ success: true, message: 'If an account exists, a login link has been sent.' })
    }

    // Generate magic link token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

    await supabase
      .from('portal_users')
      .update({ magic_link_token: token, magic_link_expires_at: expiresAt })
      .eq('id', portalUser.id)

    // Send magic link email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/public/portal/login?token=${token}`
    const org = (portalUser.customer as any)?.organization
    const customer = portalUser.customer as any
    const customerName = customer?.first_name || 'there'
    const companyName = org?.name || 'Service Official'

    try {
      const { sendEmail } = await import('@service-official/notifications')
      await sendEmail({
        to: portalUser.email,
        subject: `Sign in to your portal — ${companyName}`,
        template: 'portal_login',
        variables: {
          customer_name: customerName,
          company_name: companyName,
          login_url: loginUrl,
        },
      })
    } catch (err) {
      console.error('Portal login email failed:', err)
    }

    return NextResponse.json({
      success: true,
      message: 'Login link sent to your email.',
    })
  }

  if (action === 'verify') {
    const { token } = body
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    const { data: portalUser } = await supabase
      .from('portal_users')
      .select('*, customer:customers(*, organization:organizations(name, primary_color, logo_url, customer_portal_permissions))')
      .eq('magic_link_token', token)
      .eq('is_active', true)
      .single()

    if (!portalUser) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 401 })

    // Check expiry
    if (portalUser.magic_link_expires_at && new Date(portalUser.magic_link_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link has expired' }, { status: 401 })
    }

    // Clear token and update login time
    await supabase
      .from('portal_users')
      .update({ magic_link_token: null, magic_link_expires_at: null, last_login_at: new Date().toISOString() })
      .eq('id', portalUser.id)

    // Create a simple session token (hash of id + secret)
    const sessionToken = createHash('sha256').update(portalUser.id + Date.now().toString()).digest('hex')

    const orgPerms = (portalUser.customer as any)?.organization?.customer_portal_permissions
    const permissions = getPortalPermissions(orgPerms)

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      portal_user: {
        id: portalUser.id,
        email: portalUser.email,
        customer_id: portalUser.customer_id,
        organization_id: portalUser.organization_id,
        customer: portalUser.customer,
      },
      permissions,
    })

    response.cookies.set('portal_session', `${portalUser.id}:${sessionToken}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    // Log activity
    await supabase.from('portal_activity_log').insert({
      portal_user_id: portalUser.id,
      action: 'login',
    })

    return response
  }

  if (action === 'logout') {
    const response = NextResponse.json({ success: true })
    response.cookies.delete('portal_session')
    return response
  }

  if (action === 'session') {
    // Check current session
    const sessionCookie = request.cookies.get('portal_session')?.value
    if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const portalUserId = sessionCookie.split(':')[0]
    const { data: portalUser } = await supabase
      .from('portal_users')
      .select('*, customer:customers(*, organization:organizations(name, primary_color, secondary_color, logo_url, customer_portal_permissions))')
      .eq('id', portalUserId)
      .eq('is_active', true)
      .single()

    if (!portalUser) return NextResponse.json({ error: 'Session expired' }, { status: 401 })

    const sessionOrgPerms = (portalUser.customer as any)?.organization?.customer_portal_permissions
    const sessionPermissions = getPortalPermissions(sessionOrgPerms)

    return NextResponse.json({
      portal_user: {
        id: portalUser.id,
        email: portalUser.email,
        customer_id: portalUser.customer_id,
        organization_id: portalUser.organization_id,
        customer: portalUser.customer,
      },
      permissions: sessionPermissions,
    })
  }

  if (action === 'set-password') {
    // Set password for a portal user — requires a valid token or active session
    const { token, password } = body
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    let portalUserId: string | null = null

    if (token) {
      // Setting password during onboarding (using magic link token)
      const { data: portalUser } = await supabase
        .from('portal_users')
        .select('id, magic_link_expires_at')
        .eq('magic_link_token', token)
        .eq('is_active', true)
        .single()

      if (!portalUser) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      if (portalUser.magic_link_expires_at && new Date(portalUser.magic_link_expires_at) < new Date()) {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 })
      }
      portalUserId = portalUser.id
    } else {
      // Setting password from within the portal (using session)
      const sessionCookie = request.cookies.get('portal_session')?.value
      if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      portalUserId = sessionCookie.split(':')[0]
    }

    const passwordHash = await hashPassword(password)

    await supabase
      .from('portal_users')
      .update({ password_hash: passwordHash })
      .eq('id', portalUserId)

    // If using token, also verify and create session (same as verify action)
    if (token) {
      const { data: portalUser } = await supabase
        .from('portal_users')
        .select('*, customer:customers(*, organization:organizations(name, primary_color, logo_url, customer_portal_permissions))')
        .eq('id', portalUserId)
        .single()

      if (!portalUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      // Clear token and update login time
      await supabase
        .from('portal_users')
        .update({ magic_link_token: null, magic_link_expires_at: null, last_login_at: new Date().toISOString() })
        .eq('id', portalUserId)

      const sessionToken = createHash('sha256').update(portalUser.id + Date.now().toString()).digest('hex')
      const orgPerms = (portalUser.customer as any)?.organization?.customer_portal_permissions
      const permissions = getPortalPermissions(orgPerms)

      const response = NextResponse.json({
        success: true,
        portal_user: {
          id: portalUser.id,
          email: portalUser.email,
          customer_id: portalUser.customer_id,
          organization_id: portalUser.organization_id,
          customer: portalUser.customer,
        },
        permissions,
      })

      response.cookies.set('portal_session', `${portalUser.id}:${sessionToken}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      })

      await supabase.from('portal_activity_log').insert({ portal_user_id: portalUser.id, action: 'login' })
      return response
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'login') {
    const { email, password } = body
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const { data: portalUser } = await supabase
      .from('portal_users')
      .select('*, customer:customers(*, organization:organizations(name, primary_color, logo_url, customer_portal_permissions))')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!portalUser || !portalUser.password_hash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await verifyPassword(password, portalUser.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Update login time
    await supabase
      .from('portal_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', portalUser.id)

    const sessionToken = createHash('sha256').update(portalUser.id + Date.now().toString()).digest('hex')
    const orgPerms = (portalUser.customer as any)?.organization?.customer_portal_permissions
    const permissions = getPortalPermissions(orgPerms)

    const response = NextResponse.json({
      success: true,
      portal_user: {
        id: portalUser.id,
        email: portalUser.email,
        customer_id: portalUser.customer_id,
        organization_id: portalUser.organization_id,
        customer: portalUser.customer,
      },
      permissions,
    })

    response.cookies.set('portal_session', `${portalUser.id}:${sessionToken}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    await supabase.from('portal_activity_log').insert({ portal_user_id: portalUser.id, action: 'login' })
    return response
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
