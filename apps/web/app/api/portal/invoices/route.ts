import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { getPortalUserWithPermissions } from '@/lib/portal/permissions'

export async function GET(request: NextRequest) {
  const result = await getPortalUserWithPermissions(request)
  if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { portalUser, permissions } = result
  if (!permissions.view_invoices) return NextResponse.json({ data: [] })

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, title, status, issue_date, due_date, total, amount_due, amount_paid, project:projects(id, name)')
    .eq('customer_id', portalUser.customer_id)
    .eq('organization_id', portalUser.organization_id)
    .in('status', ['sent', 'viewed', 'partial', 'paid', 'overdue'])
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
