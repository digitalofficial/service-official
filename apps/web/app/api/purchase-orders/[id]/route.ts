import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select('*, vendor:vendors(*), project:projects(id, name), creator:profiles!created_by(first_name, last_name), approver:profiles!approved_by(first_name, last_name)')
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)
    .single()

  if (error || !po) return NextResponse.json({ error: 'PO not found' }, { status: 404 })

  const { data: lineItems } = await supabase
    .from('po_line_items')
    .select('*')
    .eq('purchase_order_id', params.id)
    .order('order_index')

  const { data: receipts } = await supabase
    .from('po_receipts')
    .select('*, receiver:profiles!received_by(first_name, last_name), items:po_receipt_items(*)')
    .eq('purchase_order_id', params.id)
    .order('received_at', { ascending: false })

  return NextResponse.json({
    data: { ...po, line_items: lineItems || [], receipts: receipts || [] }
  })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const body = await request.json()

  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, success: true })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

  // Only delete draft POs
  const { data: po } = await supabase.from('purchase_orders').select('status').eq('id', params.id).eq('organization_id', profile!.organization_id).single()
  if (!po) return NextResponse.json({ error: 'PO not found' }, { status: 404 })
  if (po.status !== 'draft') return NextResponse.json({ error: 'Can only delete draft POs' }, { status: 400 })

  const now = new Date().toISOString()
  await supabase.from('po_line_items').update({ deleted_at: now }).eq('purchase_order_id', params.id)
  const { error } = await supabase.from('purchase_orders').update({ deleted_at: now }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
