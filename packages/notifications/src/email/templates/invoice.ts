// ============================================================
// SERVICE OFFICIAL — Invoice Email Template
// ============================================================

import {
  baseLayout,
  emailHeading,
  emailText,
  emailAmount,
  emailDetailsTable,
  emailDetailRow,
  emailButton,
  emailButtonSecondary,
  emailMuted,
} from './base-layout'

interface InvoiceEmailVariables {
  customer_name: string
  company_name: string
  invoice_number: string
  total: number
  amount_due: number
  due_date: string
  payment_url?: string
  invoice_url: string
}

export function invoiceEmail(vars: InvoiceEmailVariables): string {
  const amountFormatted = `$${vars.amount_due.toFixed(2)}`
  const totalFormatted = `$${vars.total.toFixed(2)}`

  const details = emailDetailsTable(
    emailDetailRow('Invoice', `#${vars.invoice_number}`) +
    emailDetailRow('Total', totalFormatted) +
    emailDetailRow('Amount Due', `<span style="color:#c9a84c;font-weight:700;">${amountFormatted}</span>`) +
    emailDetailRow('Due Date', vars.due_date ?? 'Upon receipt')
  )

  const cta = vars.payment_url
    ? emailButton('Pay Now', vars.payment_url) + emailButtonSecondary('View Invoice', vars.invoice_url)
    : emailButton('View Invoice', vars.invoice_url)

  const content =
    emailHeading(`Invoice from ${vars.company_name}`) +
    emailText(`Hi ${vars.customer_name || 'there'},`) +
    emailText(`You have a new invoice from <strong>${vars.company_name}</strong>.`) +
    emailAmount('Amount Due', amountFormatted) +
    details +
    cta +
    emailMuted('If you have any questions about this invoice, please reply to this email or contact us directly.')

  return baseLayout({
    content,
    companyName: vars.company_name,
    previewText: `Invoice #${vars.invoice_number} — ${amountFormatted} due from ${vars.company_name}`,
  })
}
