// ============================================================
// SERVICE OFFICIAL — Job Booked Email Template
// Sent to customer when a job is created for them
// ============================================================

import {
  baseLayout,
  emailHeading,
  emailText,
  emailButton,
  emailMuted,
  emailDetailsTable,
  emailDetailRow,
} from './base-layout'

interface JobBookedEmailVariables {
  customer_name: string
  company_name: string
  job_title: string
  job_number: string
  scheduled_date?: string
  scheduled_time?: string
  address?: string
  instructions?: string
  portal_url?: string
}

export function jobBookedEmail(vars: JobBookedEmailVariables): string {
  const details = emailDetailsTable(
    emailDetailRow('Job', `${vars.job_number} — ${vars.job_title}`) +
    (vars.scheduled_date ? emailDetailRow('Date', vars.scheduled_date) : '') +
    (vars.scheduled_time ? emailDetailRow('Time', vars.scheduled_time) : '') +
    (vars.address ? emailDetailRow('Location', vars.address) : '')
  )

  const content =
    emailHeading('Your Service is Booked') +
    emailText(`Hi ${vars.customer_name || 'there'},`) +
    emailText(`<strong>${vars.company_name}</strong> has scheduled a job for you. Here are the details:`) +
    details +
    (vars.instructions
      ? `<div style="margin:16px 0 24px;padding:16px 20px;background-color:#1c2433;border-radius:8px;font-size:14px;color:#c9d1d9;line-height:22px;">
          <span style="font-size:12px;color:#8b949e;text-transform:uppercase;letter-spacing:0.5px;">Notes</span><br/>
          ${vars.instructions}
        </div>`
      : '') +
    (vars.portal_url ? emailButton('View Details', vars.portal_url) : '') +
    emailText("We'll keep you updated as things progress. You'll receive a notification when our team is on the way.") +
    emailMuted('If you have any questions, please reply to this email or contact us directly.')

  return baseLayout({
    content,
    companyName: vars.company_name,
    previewText: `${vars.company_name} has booked your service — ${vars.job_title}`,
  })
}
