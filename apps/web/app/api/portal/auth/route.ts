import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { randomBytes, createHash, scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { getPortalPermissions } from '@/lib/portal/permissions'

const scryptAsync = promisify(scrypt)

async function sendResendEmail(to: string, subject: string, html: string) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) { console.error('RESEND_API_KEY not set'); return false }

  const fromEmail = process.env.EMAIL_FROM || 'noreply@serviceofficial.app'
  const fromName = process.env.EMAIL_FROM_NAME || 'Service Official'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `${fromName} <${fromEmail}>`, to, subject, html }),
  })

  const data = await res.json()
  if (!res.ok) { console.error('Resend error:', data); return false }
  console.log('Email sent:', data.id)
  return true
}

function portalEmailTemplate(title: string, body: string, buttonText: string, buttonUrl: string, companyName: string) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background-color:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#161d27;border-radius:12px;overflow:hidden;">
<tr><td style="padding:28px 32px 20px;border-bottom:1px solid #1c2433;">
  <h1 style="margin:0;font-size:22px;font-weight:700;color:#e6edf3;">${companyName}</h1>
</td></tr>
<tr><td style="padding:32px;">
  <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#e6edf3;">${title}</h2>
  ${body}
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="background-color:#7eb8d4;border-radius:8px;">
      <a href="${buttonUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#0d1117;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">${buttonText}</a>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid #1c2433;">
  <p style="margin:0;color:#8b949e;font-size:13px;">Powered by <a href="https://serviceofficial.app" style="color:#7eb8d4;text-decoration:none;">Service Official</a></p>
</td></tr>
</table></td></tr></table></body></html>`
}

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
  const supabase = createServiceRoleClient()
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

    // Send magic link email via Resend directly
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/public/portal/login?token=${token}`
    const org = (portalUser.customer as any)?.organization
    const customer = portalUser.customer as any
    const customerName = customer?.first_name || 'there'
    const companyName = org?.name || 'Service Official'

    await sendResendEmail(
      portalUser.email,
      `Sign in to your portal — ${companyName}`,
      portalEmailTemplate(
        'Sign In to Your Portal',
        `<p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:24px;">Hi ${customerName}, click the button below to access your projects, invoices, and documents.</p>
         <p style="margin:0 0 16px;font-size:13px;color:#8b949e;">This link expires in 24 hours.</p>`,
        'Sign In',
        loginUrl,
        companyName
      )
    )

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
    const { token, password, sms_opt_in } = body
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
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

    // Save SMS opt-in on the customer record if provided
    if (sms_opt_in !== undefined) {
      const { data: pu } = await supabase.from('portal_users').select('customer_id').eq('id', portalUserId).single()
      if (pu?.customer_id) {
        await supabase.from('customers').update({ sms_opt_in: !!sms_opt_in }).eq('id', pu.customer_id)
      }
    }

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

  if (action === 'forgot-password') {
    const { email } = body
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const { data: portalUser } = await supabase
      .from('portal_users')
      .select('*, customer:customers(*, organization:organizations(name))')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!portalUser) {
      // Don't reveal if user exists
      return NextResponse.json({ success: true })
    }

    // Generate a magic link token for password reset (reuse magic_link_token)
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

    await supabase
      .from('portal_users')
      .update({ magic_link_token: token, magic_link_expires_at: expiresAt })
      .eq('id', portalUser.id)

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/public/portal/login?token=${token}&reset=true`
    const companyName = (portalUser.customer as any)?.organization?.name || 'Service Official'

    await sendResendEmail(
      portalUser.email,
      `Reset Your Password — ${companyName}`,
      portalEmailTemplate(
        'Password Reset',
        `<p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:24px;">You requested a password reset for your customer portal account.</p>
         <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:24px;">Click the button below to set a new password. This link expires in 1 hour.</p>
         <p style="margin:0;font-size:13px;color:#8b949e;">If you didn't request this, you can safely ignore this email.</p>`,
        'Reset Password',
        resetUrl,
        companyName
      )
    )

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
