import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { getPortalUserWithPermissions } from '@/lib/portal/permissions'

export async function GET(request: NextRequest) {
  const result = await getPortalUserWithPermissions(request)
  if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { portalUser, permissions } = result
  if (!permissions.view_estimates) return NextResponse.json({ data: [] })

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('estimates')
    .select('id, estimate_number, title, status, issue_date, expiry_date, total, approved_at, project:projects(id, name)')
    .eq('customer_id', portalUser.customer_id)
    .eq('organization_id', portalUser.organization_id)
    .in('status', ['sent', 'viewed', 'approved', 'declined', 'converted'])
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
