// ============================================================
// SERVICE OFFICIAL — Team Invitation Email Template
// ============================================================

import {
  baseLayout,
  emailHeading,
  emailText,
  emailButton,
  emailMuted,
  emailDivider,
} from './base-layout'

interface InvitationEmailVariables {
  org_name: string
  role: string
  invite_url: string
  inviter_name?: string
}

const roleLabelMap: Record<string, string> = {
  office_manager: 'Office Manager',
  project_manager: 'Project Manager',
  foreman: 'Foreman',
  technician: 'Technician',
  dispatcher: 'Dispatcher',
  subcontractor: 'Subcontractor',
  viewer: 'Viewer',
}

export function invitationEmail(vars: InvitationEmailVariables): string {
  const roleLabel = roleLabelMap[vars.role] ?? vars.role
  const inviterLine = vars.inviter_name
    ? `<strong>${vars.inviter_name}</strong> has invited you to join`
    : `You've been invited to join`

  const content =
    emailHeading(`You're invited!`) +
    emailText(`${inviterLine} <strong>${vars.org_name}</strong> on Service Official as a <strong>${roleLabel}</strong>.`) +
    emailText('Service Official is the operating system for contractors — manage jobs, dispatch crews, send invoices, and more from one place.') +
    emailButton('Accept Invitation', vars.invite_url) +
    emailDivider() +
    emailMuted('This invitation expires in 7 days. If you didn\'t expect this, you can safely ignore this email.')

  return baseLayout({
    content,
    companyName: vars.org_name,
    previewText: `${vars.org_name} invited you to join their team on Service Official`,
  })
}
