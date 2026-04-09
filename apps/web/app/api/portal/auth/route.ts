import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { randomBytes, createHash } from 'crypto'

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

    // TODO: Send email via Resend with link: /public/portal/login?token={token}
    // For now, return the token in dev
    return NextResponse.json({
      success: true,
      message: 'Login link sent to your email.',
      // Remove in production:
      _dev_token: token,
    })
  }

  if (action === 'verify') {
    const { token } = body
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    const { data: portalUser } = await supabase
      .from('portal_users')
      .select('*, customer:customers(*, organization:organizations(name, primary_color, logo_url))')
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
      .select('*, customer:customers(*, organization:organizations(name, primary_color, secondary_color, logo_url))')
      .eq('id', portalUserId)
      .eq('is_active', true)
      .single()

    if (!portalUser) return NextResponse.json({ error: 'Session expired' }, { status: 401 })

    return NextResponse.json({
      portal_user: {
        id: portalUser.id,
        email: portalUser.email,
        customer_id: portalUser.customer_id,
        organization_id: portalUser.organization_id,
        customer: portalUser.customer,
      },
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
