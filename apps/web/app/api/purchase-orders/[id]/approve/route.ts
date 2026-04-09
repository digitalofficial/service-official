import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()
  if (!['owner', 'admin'].includes(profile!.role)) {
    return NextResponse.json({ error: 'Only owners and admins can approve POs' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)
    .eq('status', 'pending_approval')
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'PO not found or not pending approval' }, { status: 400 })
  return NextResponse.json({ data, success: true })
}
