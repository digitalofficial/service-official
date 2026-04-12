import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile({ requireRole: ['owner', 'admin'] })
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
    .eq('status', 'pending_approval')
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'PO not found or not pending approval' }, { status: 400 })
  return NextResponse.json({ data, success: true })
}
