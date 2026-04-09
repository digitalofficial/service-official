import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

async function getPortalUser(request: NextRequest) {
  const sessionCookie = request.cookies.get('portal_session')?.value
  if (!sessionCookie) return null
  const portalUserId = sessionCookie.split(':')[0]
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.from('portal_users').select('id, customer_id, organization_id').eq('id', portalUserId).eq('is_active', true).single()
  return data
}

export async function GET(request: NextRequest) {
  const portalUser = await getPortalUser(request)
  if (!portalUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerSupabaseClient()

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
