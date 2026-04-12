// ============================================================
// SERVICE OFFICIAL — Notification Service
// Handles: in-app, SMS, email, push
// ============================================================

import type { NotificationType, MessageChannel, Profile, Project } from '@service-official/types'

interface SendNotificationOptions {
  organization_id: string
  user_id: string
  type: NotificationType
  title: string
  body?: string
  entity_type?: string
  entity_id?: string
  action_url?: string
  channels?: MessageChannel[]
  data?: Record<string, unknown>
}

interface SendSMSOptions {
  to: string
  body: string
  media_urls?: string[]
}

interface SendEmailOptions {
  to: string
  subject: string
  template: string
  variables: Record<string, unknown>
}

// ── In-App Notification ──────────────────────────────────────

export async function createNotification(options: SendNotificationOptions) {
  const { createServiceRoleClient } = await import('@service-official/database')
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      organization_id: options.organization_id,
      user_id: options.user_id,
      type: options.type,
      title: options.title,
      body: options.body,
      entity_type: options.entity_type,
      entity_id: options.entity_id,
      action_url: options.action_url,
      channels: options.channels ?? ['in_app'],
      data: options.data ?? {},
    })
    .select()
    .single()

  if (error) console.error('Failed to create notification:', error)
  return data
}

// ── SMS via Twilio ───────────────────────────────────────────

/**
 * Send SMS using the global Twilio account, with optional per-org override
 * for enterprise clients with their own Twilio credentials.
 */
export async function sendSMS(options: SendSMSOptions & { organization_id: string }) {
  const { createServiceRoleClient } = await import('@service-official/database')
  const supabase = createServiceRoleClient()

  const { data: settings } = await supabase
    .from('organization_sms_settings')
    .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, is_enabled')
    .eq('organization_id', options.organization_id)
    .single()

  if (settings && !settings.is_enabled) {
    return { success: false, error: 'SMS not enabled for this organization' }
  }

  // Per-org creds (enterprise) or global env vars
  const sid = settings?.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID
  const token = settings?.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN
  const phone = settings?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER

  if (!sid || !token || !phone) {
    return { success: false, error: 'Twilio not configured' }
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
    const auth = Buffer.from(`${sid}:${token}`).toString('base64')

    const params = new URLSearchParams({
      From: phone,
      To: options.to,
      Body: options.body,
    })
    if (options.media_urls?.length) {
      options.media_urls.forEach(url => params.append('MediaUrl', url))
    }

    const res = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })

    const data = await res.json()
    if (!res.ok) return { success: false, error: data.message ?? 'Twilio error' }
    return { success: true, sid: data.sid }
  } catch (error: any) {
    console.error('SMS send failed:', error)
    return { success: false, error: error.message }
  }
}

// ── Email via Resend ─────────────────────────────────────────

export async function sendEmail(options: SendEmailOptions) {
  const { Resend } = require('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: renderEmailTemplate(options.template, options.variables),
    })
    if (error) throw error
    return { success: true, id: data?.id }
  } catch (error) {
    console.error('Email send failed:', error)
    return { success: false, error }
  }
}

// ── Notification Templates ───────────────────────────────────

export const notificationTemplates = {
  job_assigned: (job: { title: string }, assignee: Profile) => ({
    title: `New job assigned: ${job.title}`,
    body: `You have been assigned to "${job.title}"`,
    sms: `You have a new job: ${job.title}. Open the app for details.`,
    email_subject: `New Job Assignment: ${job.title}`,
  }),

  estimate_approved: (estimate: { title: string }, customer: { display_name: string }) => ({
    title: `Estimate approved by ${customer.display_name}`,
    body: `"${estimate.title}" has been approved. Ready to convert to invoice.`,
    sms: `Good news! ${customer.display_name} approved your estimate for "${estimate.title}".`,
    email_subject: `Estimate Approved — ${estimate.title}`,
  }),

  invoice_paid: (invoice: { invoice_number: string; total: number }, customer: { display_name: string }) => ({
    title: `Payment received — $${invoice.total.toFixed(2)}`,
    body: `${customer.display_name} paid invoice #${invoice.invoice_number}`,
    sms: `Payment received! $${invoice.total.toFixed(2)} from ${customer.display_name} for invoice #${invoice.invoice_number}.`,
    email_subject: `Payment Received — Invoice #${invoice.invoice_number}`,
  }),

  invoice_overdue: (invoice: { invoice_number: string; amount_due: number; due_date: string }) => ({
    title: `Invoice #${invoice.invoice_number} is overdue`,
    body: `$${invoice.amount_due.toFixed(2)} was due on ${invoice.due_date}`,
    sms: `Reminder: Invoice #${invoice.invoice_number} for $${invoice.amount_due.toFixed(2)} is overdue.`,
    email_subject: `Overdue Invoice — #${invoice.invoice_number}`,
  }),

  project_milestone: (project: Project, milestone: { name: string }) => ({
    title: `Milestone reached: ${milestone.name}`,
    body: `${milestone.name} completed on ${project.name}`,
    sms: `Update on ${project.name}: "${milestone.name}" has been completed.`,
    email_subject: `Project Update — ${milestone.name} Completed`,
  }),

  client_milestone: (project: Project, milestone: { name: string }) => ({
    title: `Project Update: ${milestone.name}`,
    body: `We wanted to let you know that "${milestone.name}" has been completed on your project.`,
    sms: `Hi! We wanted to update you: "${milestone.name}" is complete on your ${project.name} project.`,
    email_subject: `Your Project Update — ${milestone.name} Complete`,
  }),

  expense_submitted: (expense: { title: string; total_amount: number }, submitter: Profile) => ({
    title: `Expense submitted for approval`,
    body: `${submitter.first_name} submitted "$${expense.total_amount.toFixed(2)} — ${expense.title}"`,
    sms: `${submitter.first_name} submitted an expense for approval: ${expense.title} ($${expense.total_amount.toFixed(2)})`,
    email_subject: `Expense Approval Needed — ${expense.title}`,
  }),

  rfi_submitted: (rfi: { rfi_number: string; title: string }, project: Project) => ({
    title: `New RFI on ${project.name}`,
    body: `RFI #${rfi.rfi_number}: ${rfi.title} requires your response.`,
    sms: `New RFI submitted on ${project.name}: ${rfi.title}. Please respond.`,
    email_subject: `RFI #${rfi.rfi_number} — ${project.name}`,
  }),

  change_order_approved: (co: { co_number: string; title: string; amount: number }) => ({
    title: `Change order approved`,
    body: `CO #${co.co_number} "${co.title}" — $${co.amount.toFixed(2)} approved.`,
    sms: `Change order approved: CO #${co.co_number} for $${co.amount.toFixed(2)}.`,
    email_subject: `Change Order Approved — CO #${co.co_number}`,
  }),
}

// ── Push via Expo Push API ──────────────────────────────────

interface PushMessage {
  to: string
  title: string
  body: string
  sound?: string
  badge?: number
  data?: Record<string, unknown>
}

/**
 * Send push notifications via Expo Push API.
 * Supports single or batch (up to 100 per request per Expo limits).
 */
export async function sendPushNotifications(messages: PushMessage[]) {
  if (!messages.length) return { success: true, results: [] }

  // Expo Push API accepts up to 100 messages per request
  const BATCH_SIZE = 100
  const results: any[] = []

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE).map(msg => ({
      to: msg.to,
      title: msg.title,
      body: msg.body,
      sound: msg.sound ?? 'default',
      badge: msg.badge ?? 1,
      data: msg.data ?? {},
    }))

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(batch),
      })
      const json = await res.json()
      results.push(...(json.data ?? []))
    } catch (err) {
      console.error('Expo Push API error:', err)
    }
  }

  return { success: true, results }
}

// ── Broadcast to all org users by role ──────────────────────

export async function notifyTeam(options: {
  organization_id: string
  roles?: string[]
  user_ids?: string[]
  type: NotificationType
  title: string
  body?: string
  entity_type?: string
  entity_id?: string
  action_url?: string
  channels?: MessageChannel[]
  data?: Record<string, unknown>
}) {
  const { createServiceRoleClient } = await import('@service-official/database')
  const supabase = createServiceRoleClient()

  const channels = options.channels ?? ['in_app']

  let query = supabase
    .from('profiles')
    .select('id, notify_sms, notify_email, notify_push, phone, email, push_token')
    .eq('organization_id', options.organization_id)
    .eq('is_active', true)

  if (options.roles?.length) {
    query = query.in('role', options.roles)
  }
  if (options.user_ids?.length) {
    query = query.in('id', options.user_ids)
  }

  const { data: users } = await query
  if (!users?.length) return { sent: 0 }

  // Create in-app notifications
  const notifications = users.map(user => ({
    organization_id: options.organization_id,
    user_id: user.id,
    type: options.type,
    title: options.title,
    body: options.body,
    entity_type: options.entity_type,
    entity_id: options.entity_id,
    action_url: options.action_url,
    channels,
  }))

  await supabase.from('notifications').insert(notifications)

  // Send push notifications to users who have tokens and opted in
  if (channels.includes('push')) {
    const pushMessages: PushMessage[] = users
      .filter(u => u.push_token && u.notify_push !== false)
      .map(u => ({
        to: u.push_token!,
        title: options.title,
        body: options.body ?? '',
        data: {
          type: options.type,
          entity_type: options.entity_type,
          entity_id: options.entity_id,
          action_url: options.action_url,
          ...options.data,
        },
      }))

    if (pushMessages.length) {
      await sendPushNotifications(pushMessages)
    }
  }

  return { sent: users.length }
}

// ── Broadcast to ALL users across ALL orgs (super admin) ────

export async function broadcastPushToAll(options: {
  title: string
  body: string
  organization_id?: string
  data?: Record<string, unknown>
}) {
  const { createServiceRoleClient } = await import('@service-official/database')
  const supabase = createServiceRoleClient()

  let query = supabase
    .from('profiles')
    .select('id, organization_id, push_token')
    .eq('is_active', true)
    .not('push_token', 'is', null)

  // Optionally scope to a single org
  if (options.organization_id) {
    query = query.eq('organization_id', options.organization_id)
  }

  const { data: users, error } = await query
  if (error) {
    console.error('broadcastPushToAll query failed:', error)
    return { success: false, error: error.message, sent: 0 }
  }
  if (!users?.length) return { success: true, sent: 0 }

  // Build push messages
  const pushMessages: PushMessage[] = users.map(u => ({
    to: u.push_token!,
    title: options.title,
    body: options.body,
    data: {
      type: 'announcement' as const,
      ...options.data,
    },
  }))

  const result = await sendPushNotifications(pushMessages)

  // Create in-app notification records grouped by org
  const byOrg = new Map<string, string[]>()
  for (const user of users) {
    const arr = byOrg.get(user.organization_id) ?? []
    arr.push(user.id)
    byOrg.set(user.organization_id, arr)
  }

  for (const [orgId, userIds] of byOrg) {
    const rows = userIds.map(uid => ({
      organization_id: orgId,
      user_id: uid,
      type: 'announcement' as const,
      title: options.title,
      body: options.body,
      channels: ['in_app', 'push'] as MessageChannel[],
    }))
    await supabase.from('notifications').insert(rows)
  }

  return { success: true, sent: users.length, results: result.results }
}

// ── Render Email Template ────────────────────────────────────

import { renderEmailTemplate } from './email'
export { renderEmailTemplate }
export * from './email'
