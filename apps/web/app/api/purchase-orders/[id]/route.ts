import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select('*, vendor:vendors(*), project:projects(id, name), creator:profiles!created_by(first_name, last_name), approver:profiles!approved_by(first_name, last_name)')
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
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
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

  const body = await request.json()

  // Get current PO to detect status change
  const { data: existing } = await supabase
    .from('purchase_orders')
    .select('status, po_number, project_id, job_id')
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
    .single()

  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync linked materials and expenses when PO status changes
  if (body.status && existing && body.status !== existing.status) {
    const poNumber = existing.po_number

    // Map PO status to material status
    const matStatusMap: Record<string, string> = {
      draft: 'pending',
      pending_approval: 'pending',
      approved: 'ordered',
      sent: 'ordered',
      partial: 'partial',
      fulfilled: 'received',
      closed: 'received',
      canceled: 'pending',
    }
    const newMatStatus = matStatusMap[body.status] || 'pending'

    // Map PO status to expense status
    const expStatusMap: Record<string, string> = {
      draft: 'pending',
      pending_approval: 'pending',
      approved: 'approved',
      sent: 'approved',
      partial: 'approved',
      fulfilled: 'approved',
      closed: 'approved',
      canceled: 'rejected',
    }
    const newExpStatus = expStatusMap[body.status] || 'pending'

    // Update linked materials by po_number
    await supabase
      .from('project_materials')
      .update({ status: newMatStatus, updated_at: new Date().toISOString() })
      .eq('po_number', poNumber)
      .eq('organization_id', profile.organization_id)

    // Update linked expense by title match
    const expUpdates: Record<string, any> = {
      status: newExpStatus,
      updated_at: new Date().toISOString(),
    }
    if (newExpStatus === 'approved') {
      expUpdates.approved_by = user.id
      expUpdates.approved_at = new Date().toISOString()
    }
    await supabase
      .from('expenses')
      .update(expUpdates)
      .like('title', `PO ${poNumber}%`)
      .eq('organization_id', profile.organization_id)
  }

  return NextResponse.json({ data, success: true })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  // Only delete draft POs
  const { data: po } = await supabase.from('purchase_orders').select('status').eq('id', params.id).eq('organization_id', profile.organization_id).single()
  if (!po) return NextResponse.json({ error: 'PO not found' }, { status: 404 })
  if (po.status !== 'draft') return NextResponse.json({ error: 'Can only delete draft POs' }, { status: 400 })

  const now = new Date().toISOString()
  await supabase.from('po_line_items').update({ deleted_at: now }).eq('purchase_order_id', params.id)
  const { error } = await supabase.from('purchase_orders').update({ deleted_at: now }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
