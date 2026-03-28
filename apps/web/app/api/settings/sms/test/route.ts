import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id, role, phone').eq('id', user.id).single()
  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { twilio_account_sid, twilio_auth_token, twilio_phone_number } = await request.json()

  if (!twilio_account_sid || !twilio_auth_token || !twilio_phone_number) {
    return NextResponse.json({ error: 'Missing Twilio credentials' }, { status: 400 })
  }

  // Send test SMS to the logged-in user's phone
  const toPhone = profile.phone
  if (!toPhone) {
    return NextResponse.json({ error: 'Add your phone number in your profile first' }, { status: 400 })
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilio_account_sid}/Messages.json`
    const auth = Buffer.from(`${twilio_account_sid}:${twilio_auth_token}`).toString('base64')

    const res = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilio_phone_number,
        To: toPhone,
        Body: `Service Official test: Your Twilio SMS is working! Job reminders will be sent from this number.`,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.message ?? 'Twilio error' }, { status: 400 })
    }

    return NextResponse.json({ success: true, sid: data.sid })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
