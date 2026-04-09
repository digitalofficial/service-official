// ============================================================
// SERVICE OFFICIAL — Email Template Registry
// Maps template names to branded HTML renderers
// ============================================================

export { baseLayout, emailButton, emailButtonSecondary, emailHeading, emailText, emailMuted, emailAmount, emailDivider, emailDetailRow, emailDetailsTable } from './templates/base-layout'
export { invoiceEmail } from './templates/invoice'
export { estimateEmail } from './templates/estimate'
export { invitationEmail } from './templates/invitation'
export { notificationEmail, jobAssignedEmail, invoicePaidEmail, estimateApprovedEmail, invoiceOverdueEmail } from './templates/notification'
export { jobBookedEmail } from './templates/job-booked'

import { invoiceEmail } from './templates/invoice'
import { estimateEmail } from './templates/estimate'
import { invitationEmail } from './templates/invitation'
import { notificationEmail } from './templates/notification'
import { jobBookedEmail } from './templates/job-booked'
import { baseLayout, emailHeading, emailText } from './templates/base-layout'

/**
 * Render a named email template with variables.
 * Falls back to a simple branded wrapper if template is unknown.
 */
export function renderEmailTemplate(template: string, variables: Record<string, unknown>): string {
  switch (template) {
    case 'invoice':
      return invoiceEmail(variables as any)

    case 'estimate':
      return estimateEmail(variables as any)

    case 'invitation':
      return invitationEmail(variables as any)

    case 'notification':
      return notificationEmail(variables as any)

    case 'job_booked':
      return jobBookedEmail(variables as any)

    default:
      // Fallback: render raw content in branded layout
      return baseLayout({
        content:
          emailHeading(String(variables.title ?? 'Notification')) +
          emailText(String(variables.body ?? template)),
        companyName: String(variables.company_name ?? 'Service Official'),
      })
  }
}
