// ============================================================
// SERVICE OFFICIAL — Estimate Email Template
// ============================================================

import {
  baseLayout,
  emailHeading,
  emailText,
  emailAmount,
  emailDetailsTable,
  emailDetailRow,
  emailButton,
  emailMuted,
} from './base-layout'

interface EstimateEmailVariables {
  customer_name: string
  company_name: string
  estimate_number: string
  estimate_total: number
  estimate_url: string
  expiry_date?: string
}

export function estimateEmail(vars: EstimateEmailVariables): string {
  const totalFormatted = `$${vars.estimate_total.toFixed(2)}`

  const details = emailDetailsTable(
    emailDetailRow('Estimate', `#${vars.estimate_number}`) +
    emailDetailRow('Total', `<span style="color:#c9a84c;font-weight:700;">${totalFormatted}</span>`) +
    (vars.expiry_date ? emailDetailRow('Valid Until', vars.expiry_date) : '')
  )

  const content =
    emailHeading(`Estimate from ${vars.company_name}`) +
    emailText(`Hi ${vars.customer_name || 'there'},`) +
    emailText(`<strong>${vars.company_name}</strong> has prepared an estimate for you. Review the details and approve it online.`) +
    emailAmount('Estimated Total', totalFormatted) +
    details +
    emailButton('View Estimate', vars.estimate_url) +
    emailMuted('If you have any questions about this estimate, please reply to this email or contact us directly.')

  return baseLayout({
    content,
    companyName: vars.company_name,
    previewText: `Estimate #${vars.estimate_number} — ${totalFormatted} from ${vars.company_name}`,
  })
}
