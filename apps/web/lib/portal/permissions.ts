import { NextRequest } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'

export const DEFAULT_PORTAL_PERMISSIONS = {
  view_invoices: true,
  view_estimates: true,
  view_projects: true,
  view_payment_history: true,
  pay_invoices: true,
  send_messages: true,
  view_photos: true,
  view_files: true,
}

export type PortalPermissions = typeof DEFAULT_PORTAL_PERMISSIONS

export function getPortalPermissions(orgPermissions: Partial<PortalPermissions> | null | undefined): PortalPermissions {
  return { ...DEFAULT_PORTAL_PERMISSIONS, ...(orgPermissions ?? {}) }
}

export async function getPortalUserWithPermissions(request: NextRequest) {
  const sessionCookie = request.cookies.get('portal_session')?.value
  if (!sessionCookie) return null

  const portalUserId = sessionCookie.split(':')[0]
  const supabase = createServiceRoleClient()

  const { data: portalUser } = await supabase
    .from('portal_users')
    .select('id, customer_id, organization_id, email')
    .eq('id', portalUserId)
    .eq('is_active', true)
    .single()

  if (!portalUser) return null

  const { data: org } = await supabase
    .from('organizations')
    .select('customer_portal_permissions')
    .eq('id', portalUser.organization_id)
    .single()

  const permissions = getPortalPermissions(org?.customer_portal_permissions)

  return { portalUser, permissions }
}
