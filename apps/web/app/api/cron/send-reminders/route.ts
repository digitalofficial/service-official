import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { tierHasSms } from '@/lib/auth/tier-access'

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

  // Fetch org tiers to check SMS access
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, subscription_tier, subscription_status')
    .in('id', orgIds)

  const orgTierMap = new Map((orgs ?? []).map(o => [o.id, { tier: o.subscription_tier, status: o.subscription_status }]))

  // Fetch SMS settings for all relevant orgs (for notification toggles + optional per-org creds)
  const { data: allSettings } = await supabase
    .from('organization_sms_settings')
    .select('*')
    .in('organization_id', orgIds)

  const settingsMap = new Map(
    (allSettings ?? []).map(s => [s.organization_id, s])
  )

  // Global Twilio credentials (used for all clients unless they have their own)
  const globalSid = process.env.TWILIO_ACCOUNT_SID
  const globalToken = process.env.TWILIO_AUTH_TOKEN
  const globalPhone = process.env.TWILIO_PHONE_NUMBER

  let sent = 0
  let failed = 0

  for (const reminder of reminders) {
    const settings = settingsMap.get(reminder.organization_id)

    // Check tier — skip SMS for orgs on solo plan
    const orgInfo = orgTierMap.get(reminder.organization_id) ?? { tier: 'solo', status: 'active' }
    if (!tierHasSms(orgInfo.tier, orgInfo.status)) {
      await supabase
        .from('job_reminders')
        .update({ status: 'failed', error_message: 'SMS requires Team plan or higher' })
        .eq('id', reminder.id)
      failed++
      continue
    }

    // Check if SMS is explicitly disabled for this org
    if (settings?.is_enabled === false) {
      await supabase
        .from('job_reminders')
        .update({ status: 'failed', error_message: 'SMS not enabled for this organization' })
        .eq('id', reminder.id)
      failed++
      continue
    }

    // Use per-org creds (enterprise) or fall back to global
    const sid = settings?.twilio_account_sid || globalSid
    const token = settings?.twilio_auth_token || globalToken
    const phone = settings?.twilio_phone_number || globalPhone

    if (!sid || !token || !phone) {
      await supabase
        .from('job_reminders')
        .update({ status: 'failed', error_message: 'Twilio not configured' })
        .eq('id', reminder.id)
      failed++
      continue
    }

    try {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
      const auth = Buffer.from(`${sid}:${token}`).toString('base64')

      const res = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: phone,
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
