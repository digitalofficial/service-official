// ============================================================
// SERVICE OFFICIAL — Notification Email Templates
// Generic templates for job_assigned, estimate_approved,
// invoice_paid, invoice_overdue, and other notifications
// ============================================================

import {
  baseLayout,
  emailHeading,
  emailText,
  emailButton,
  emailAmount,
  emailMuted,
  emailDivider,
} from './base-layout'

interface NotificationEmailVariables {
  title: string
  body: string
  action_url?: string
  action_label?: string
  company_name?: string
}

/** Generic notification email — works for any notification type */
export function notificationEmail(vars: NotificationEmailVariables): string {
  const content =
    emailHeading(vars.title) +
    emailText(vars.body) +
    (vars.action_url ? emailButton(vars.action_label ?? 'View Details', vars.action_url) : '') +
    emailMuted('You received this because of your notification preferences. You can update them in the app.')

  return baseLayout({
    content,
    companyName: vars.company_name,
    previewText: vars.title,
  })
}

// ── Specialized notification templates ─────────────────────

interface JobAssignedVariables {
  job_title: string
  schedule_date?: string
  customer_name?: string
  address?: string
  action_url: string
  company_name?: string
}

export function jobAssignedEmail(vars: JobAssignedVariables): string {
  let detailLines = ''
  if (vars.customer_name) detailLines += `<strong>Customer:</strong> ${vars.customer_name}<br/>`
  if (vars.schedule_date) detailLines += `<strong>Scheduled:</strong> ${vars.schedule_date}<br/>`
  if (vars.address) detailLines += `<strong>Location:</strong> ${vars.address}<br/>`

  const detailBlock = detailLines
    ? `<div style="margin:16px 0 24px;padding:16px 20px;background-color:#1c2433;border-radius:8px;font-size:14px;color:#c9d1d9;line-height:22px;">${detailLines}</div>`
    : ''

  const content =
    emailHeading('New Job Assigned') +
    emailText(`You've been assigned to <strong>${vars.job_title}</strong>.`) +
    detailBlock +
    emailButton('View Job', vars.action_url)

  return baseLayout({
    content,
    companyName: vars.company_name,
    previewText: `New job: ${vars.job_title}`,
  })
}

interface InvoicePaidVariables {
  invoice_number: string
  amount: number
  customer_name: string
  action_url: string
  company_name?: string
}

export function invoicePaidEmail(vars: InvoicePaidVariables): string {
  const amountFormatted = `$${vars.amount.toFixed(2)}`

  const content =
    emailHeading('Payment Received') +
    emailText(`<strong>${vars.customer_name}</strong> has paid invoice <strong>#${vars.invoice_number}</strong>.`) +
    emailAmount('Amount Received', amountFormatted) +
    emailButton('View Invoice', vars.action_url)

  return baseLayout({
    content,
    companyName: vars.company_name,
    previewText: `Payment received — ${amountFormatted} from ${vars.customer_name}`,
  })
}

interface EstimateApprovedVariables {
  estimate_title: string
  customer_name: string
  action_url: string
  company_name?: string
}

export function estimateApprovedEmail(vars: EstimateApprovedVariables): string {
  const content =
    emailHeading('Estimate Approved') +
    emailText(`Great news! <strong>${vars.customer_name}</strong> has approved your estimate for <strong>${vars.estimate_title}</strong>.`) +
    emailText('You can now convert this estimate into an invoice.') +
    emailButton('View Estimate', vars.action_url)

  return baseLayout({
    content,
    companyName: vars.company_name,
    previewText: `${vars.customer_name} approved estimate: ${vars.estimate_title}`,
  })
}

interface InvoiceOverdueVariables {
  invoice_number: string
  amount_due: number
  due_date: string
  customer_name?: string
  action_url: string
  company_name?: string
}

export function invoiceOverdueEmail(vars: InvoiceOverdueVariables): string {
  const amountFormatted = `$${vars.amount_due.toFixed(2)}`

  const content =
    emailHeading('Invoice Overdue') +
    emailText(`Invoice <strong>#${vars.invoice_number}</strong>${vars.customer_name ? ` for <strong>${vars.customer_name}</strong>` : ''} is past due.`) +
    emailAmount('Overdue Amount', amountFormatted) +
    emailText(`This invoice was due on <strong>${vars.due_date}</strong>. Consider following up with the customer.`) +
    emailButton('View Invoice', vars.action_url)

  return baseLayout({
    content,
    companyName: vars.company_name,
    previewText: `Overdue: Invoice #${vars.invoice_number} — ${amountFormatted}`,
  })
}
