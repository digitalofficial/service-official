// ============================================================
// SERVICE OFFICIAL — Welcome Email Template
// Sent to new contractors when their account is created
// ============================================================

import {
  baseLayout,
  emailHeading,
  emailText,
  emailButton,
  emailMuted,
  emailDivider,
  emailDetailRow,
  emailDetailsTable,
} from './base-layout'

interface WelcomeEmailVariables {
  company_name: string
  first_name: string
  login_url: string
  email: string
  temp_password: string
  trial_days: number
}

export function welcomeEmail(vars: WelcomeEmailVariables): string {
  const content =
    emailHeading(`Welcome to Service Official!`) +
    emailText(`Hi ${vars.first_name},`) +
    emailText(`Your account for <strong>${vars.company_name}</strong> is ready. You can log in now and start managing your jobs, estimates, invoices, and crew — all from one place.`) +
    emailDetailsTable(
      emailDetailRow('Login URL', `<a href="${vars.login_url}" style="color:#7eb8d4;">${vars.login_url}</a>`) +
      emailDetailRow('Email', vars.email) +
      emailDetailRow('Temporary Password', `<code style="background:#1c2433;padding:2px 8px;border-radius:4px;color:#c9a84c;font-size:15px;">${vars.temp_password}</code>`)
    ) +
    emailButton('Log In Now', vars.login_url) +
    emailDivider() +
    emailText('Please change your password after your first login.') +
    emailMuted(`You have a ${vars.trial_days}-day free trial. If you have any questions, just reply to this email.`)

  return baseLayout({
    content,
    companyName: vars.company_name,
    previewText: `Your ${vars.company_name} account is ready — log in to get started`,
  })
}
