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
}) {
  const { createServiceRoleClient } = await import('@service-official/database')
  const supabase = createServiceRoleClient()

  let query = supabase
    .from('profiles')
    .select('id, notify_sms, notify_email, notify_push, phone, email')
    .eq('organization_id', options.organization_id)
    .eq('is_active', true)

  if (options.roles?.length) {
    query = query.in('role', options.roles)
  }
  if (options.user_ids?.length) {
    query = query.in('id', options.user_ids)
  }

  const { data: users } = await query
  if (!users?.length) return

  const notifications = users.map(user => ({
    organization_id: options.organization_id,
    user_id: user.id,
    type: options.type,
    title: options.title,
    body: options.body,
    entity_type: options.entity_type,
    entity_id: options.entity_id,
    action_url: options.action_url,
    channels: options.channels ?? ['in_app'],
  }))

  await supabase.from('notifications').insert(notifications)
}

// ── Render Email Template ────────────────────────────────────

function renderEmailTemplate(template: string, variables: Record<string, unknown>): string {
  // TODO: Replace with proper template engine (react-email, etc.)
  return `<html><body>${template}</body></html>`
}
