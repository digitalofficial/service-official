import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // Generate a recovery link via admin API
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      },
    })

    if (error) {
      console.error('Password reset generate link error:', error)
      return NextResponse.json({ success: true })
    }

    const actionLink = data.properties?.action_link
    if (!actionLink) {
      console.error('No action link generated for:', email)
      return NextResponse.json({ success: true })
    }

    // Build reset link
    const url = new URL(actionLink)
    const token = url.searchParams.get('token')
    const type = url.searchParams.get('type')

    const resetLink = token
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`)}`
      : actionLink

    // Send email directly via Resend REST API — no package dependency
    const resendKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.EMAIL_FROM || 'noreply@serviceofficial.app'
    const fromName = process.env.EMAIL_FROM_NAME || 'Service Official'

    if (!resendKey) {
      console.error('RESEND_API_KEY is not set!')
      return NextResponse.json({ success: true })
    }

    console.log(`Sending password reset email to ${email} via Resend...`)

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: email,
        subject: 'Reset Your Password — Service Official',
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#161d27;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:28px 32px 20px;border-bottom:1px solid #1c2433;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#e6edf3;letter-spacing:-0.3px;">Service Official</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#e6edf3;">Password Reset</h2>
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
        </td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid #1c2433;">
          <p style="margin:0;color:#8b949e;font-size:13px;line-height:20px;">
            Powered by <a href="https://serviceofficial.app" style="color:#7eb8d4;text-decoration:none;">Service Official</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      console.error('Resend API error:', resendData)
      return NextResponse.json({ success: true })
    }

    console.log('Password reset email sent successfully:', resendData.id)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Forgot password error:', err)
    return NextResponse.json({ success: true })
  }
}
