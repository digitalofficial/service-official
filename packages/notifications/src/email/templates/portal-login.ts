import { baseLayout, emailHeading, emailText, emailButton, emailMuted } from './base-layout'

interface PortalLoginEmailVars {
  customer_name: string
  company_name: string
  login_url: string
}

export function portalLoginEmail(vars: PortalLoginEmailVars): string {
  return baseLayout({
    previewText: `Sign in to your client portal — ${vars.company_name}`,
    companyName: vars.company_name,
    content:
      emailHeading(`Hi ${vars.customer_name},`) +
      emailText(`You requested a login link for your client portal with <strong>${vars.company_name}</strong>.`) +
      emailText('Click the button below to sign in and access your projects, invoices, and documents.') +
      emailButton('Sign In to Portal', vars.login_url) +
      emailMuted('This link expires in 24 hours. If you didn\'t request this, you can safely ignore this email.'),
  })
}
