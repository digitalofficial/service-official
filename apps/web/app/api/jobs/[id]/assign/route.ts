import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { notifyCustomer } from '@/lib/sms'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const body = await request.json()
  const { assigned_to } = body

  if (!assigned_to) return NextResponse.json({ error: 'assigned_to is required' }, { status: 400 })

  // Update job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .update({ assigned_to, status: 'scheduled' })
    .eq('id', params.id)
    .select('*, customer:customers(first_name, last_name, company_name)')
    .single()

  if (jobError) return NextResponse.json({ error: jobError.message }, { status: 500 })

  // Get the assignee's phone
  const { data: assignee } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, phone')
    .eq('id', assigned_to)
    .single()

  if (!assignee?.phone) {
    return NextResponse.json({ data: job, warning: 'Job assigned but employee has no phone number — no SMS sent' })
  }

  // Get org SMS settings
  const { data: smsSettings } = await supabase
    .from('organization_sms_settings')
    .select('*')
    .eq('organization_id', profile!.organization_id)
    .single()

  if (!smsSettings?.is_enabled) {
    return NextResponse.json({ data: job, warning: 'Job assigned but SMS is not enabled — configure in Settings > SMS' })
  }

  // Get org domain for login link
  const { data: domain } = await supabase
    .from('organization_domains')
    .select('domain')
    .eq('organization_id', profile!.organization_id)
    .eq('is_primary', true)
    .single()

  const loginUrl = domain?.domain ? `https://${domain.domain}` : process.env.NEXT_PUBLIC_APP_URL

  // Build message
  const customerName = job.customer
    ? ((job.customer as any).company_name ?? `${(job.customer as any).first_name} ${(job.customer as any).last_name}`)
    : ''
  const location = [job.address_line1, job.city, job.state].filter(Boolean).join(', ')
  const scheduledTime = job.scheduled_start
    ? new Date(job.scheduled_start).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'TBD'

  const baseMessage = `"${job.title}"${customerName ? ` - ${customerName}` : ''}
${location ? `📍 ${location}` : ''}
🕐 ${scheduledTime}
${loginUrl}`

  const remindersToCreate = []

  // Immediate assignment SMS
  if (smsSettings.send_assignment_sms) {
    remindersToCreate.push({
      organization_id: profile!.organization_id,
      job_id: params.id,
      profile_id: assigned_to,
      remind_at: new Date().toISOString(),
      reminder_type: 'assignment',
      phone_number: assignee.phone,
      message_body: `New job assigned to you:\n${baseMessage}`,
      status: 'pending',
    })
  }

  // Scheduled reminders (only if job has a start time)
  if (job.scheduled_start) {
    const startTime = new Date(job.scheduled_start).getTime()

    const intervalMap: Record<string, number> = {
      '15 minutes': 15 * 60 * 1000,
      '30 minutes': 30 * 60 * 1000,
      '1 hour': 60 * 60 * 1000,
      '2 hours': 2 * 60 * 60 * 1000,
      '1 day': 24 * 60 * 60 * 1000,
    }

    const typeMap: Record<string, string> = {
      '15 minutes': '15_min',
      '30 minutes': '30_min',
      '1 hour': '1_hour',
      '2 hours': '1_hour',
      '1 day': '1_day',
    }

    const labelMap: Record<string, string> = {
      '15 minutes': 'in 15 minutes',
      '30 minutes': 'in 30 minutes',
      '1 hour': 'in 1 hour',
      '2 hours': 'in 2 hours',
      '1 day': 'tomorrow',
    }

    for (const reminderInterval of [smsSettings.default_reminder_1, smsSettings.default_reminder_2]) {
      const ms = intervalMap[reminderInterval]
      if (!ms) continue

      const remindAt = new Date(startTime - ms)
      if (remindAt.getTime() <= Date.now()) continue // Don't schedule past reminders

      remindersToCreate.push({
        organization_id: profile!.organization_id,
        job_id: params.id,
        profile_id: assigned_to,
        remind_at: remindAt.toISOString(),
        reminder_type: typeMap[reminderInterval] ?? 'custom',
        phone_number: assignee.phone,
        message_body: `Reminder: You have a job ${labelMap[reminderInterval] ?? 'coming up'}:\n${baseMessage}`,
        status: 'pending',
      })
    }
  }

  // Insert reminders
  if (remindersToCreate.length > 0) {
    // Cancel any existing pending reminders for this job/person
    await supabase
      .from('job_reminders')
      .update({ status: 'canceled' })
      .eq('job_id', params.id)
      .eq('profile_id', assigned_to)
      .eq('status', 'pending')

    await supabase.from('job_reminders').insert(remindersToCreate)
  }

  // Notify customer that the job is booked
  const customerSms = await notifyCustomer(profile!.organization_id, params.id, 'booked').catch(() => ({ success: false }))

  return NextResponse.json({
    data: job,
    reminders_scheduled: remindersToCreate.length,
    customer_notified: customerSms.success,
    message: `Job assigned to ${assignee.first_name}. ${remindersToCreate.length} SMS reminder(s) scheduled.${customerSms.success ? ' Customer notified.' : ''}`,
  })
}
