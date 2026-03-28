import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const now = new Date().toISOString()

  // Get all pending reminders that are due
  const { data: reminders, error } = await supabase
    .from('job_reminders')
    .select('*')
    .eq('status', 'pending')
    .lte('remind_at', now)
    .order('remind_at', { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!reminders || reminders.length === 0) {
    return NextResponse.json({ message: 'No reminders due', sent: 0 })
  }

  // Group by org to batch credential lookups
  const orgIds = [...new Set(reminders.map(r => r.organization_id))]

  // Fetch SMS settings for all relevant orgs
  const { data: allSettings } = await supabase
    .from('organization_sms_settings')
    .select('*')
    .in('organization_id', orgIds)
    .eq('is_enabled', true)

  const settingsMap = new Map(
    (allSettings ?? []).map(s => [s.organization_id, s])
  )

  let sent = 0
  let failed = 0

  for (const reminder of reminders) {
    const settings = settingsMap.get(reminder.organization_id)

    if (!settings) {
      // Org doesn't have SMS enabled — mark as failed
      await supabase
        .from('job_reminders')
        .update({ status: 'failed', error_message: 'SMS not enabled for this organization' })
        .eq('id', reminder.id)
      failed++
      continue
    }

    try {
      // Send via Twilio using the org's credentials
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${settings.twilio_account_sid}/Messages.json`
      const auth = Buffer.from(`${settings.twilio_account_sid}:${settings.twilio_auth_token}`).toString('base64')

      const res = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: settings.twilio_phone_number,
          To: reminder.phone_number,
          Body: reminder.message_body,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        await supabase
          .from('job_reminders')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', reminder.id)
        sent++
      } else {
        await supabase
          .from('job_reminders')
          .update({ status: 'failed', error_message: data.message ?? 'Twilio error' })
          .eq('id', reminder.id)
        failed++
      }
    } catch (err: any) {
      await supabase
        .from('job_reminders')
        .update({ status: 'failed', error_message: err.message })
        .eq('id', reminder.id)
      failed++
    }
  }

  return NextResponse.json({
    message: `Processed ${reminders.length} reminders`,
    sent,
    failed,
    timestamp: now,
  })
}
