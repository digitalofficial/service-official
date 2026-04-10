import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@service-official/notifications'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Generate a magic link for password recovery via admin API
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      },
    })

    if (error) {
      console.error('Password reset error:', error)
      // Don't reveal if email exists or not
      return NextResponse.json({ success: true })
    }

    // Extract the token from the action link
    const actionLink = data.properties?.action_link
    if (!actionLink) {
      console.error('No action link generated')
      return NextResponse.json({ success: true })
    }

    // Build a reset link through Supabase's verify endpoint with redirect
    const url = new URL(actionLink)
    const token = url.searchParams.get('token')
    const type = url.searchParams.get('type')

    const resetLink = token
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`)}`
      : actionLink

    // Send branded email via Resend
    await sendEmail({
      to: email,
      subject: 'Reset Your Password — Service Official',
      template: 'default',
      variables: {
        title: 'Password Reset',
        body: `
          <p style="margin:0 0 16px;font-size:15px;color:#c9d1d9;line-height:24px;">
            You requested a password reset for your Service Official account.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#c9d1d9;line-height:24px;">
            Click the button below to set a new password. This link expires in 1 hour.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr><td style="background-color:#7eb8d4;border-radius:8px;">
              <a href="${resetLink}" target="_blank" style="display:inline-block;padding:14px 32px;color:#0d1117;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                Reset Password
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 12px;font-size:13px;color:#8b949e;line-height:20px;">
            If you didn't request this, you can safely ignore this email. Your password won't change.
          </p>
        `,
        company_name: 'Service Official',
      },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Forgot password error:', err)
    return NextResponse.json({ success: true }) // Don't reveal errors
  }
}
