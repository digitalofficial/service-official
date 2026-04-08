import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

// PATCH /api/invoices/[id] — update invoice (mark paid, adjust amounts, etc.)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!['owner', 'admin', 'office_manager'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Verify invoice belongs to user's org
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, organization_id, total')
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const body = await request.json()
  const allowed = ['status', 'amount_paid', 'amount_due', 'paid_at', 'notes', 'due_date']
  const updates: Record<string, any> = {}

  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  // If marking as paid, auto-fill paid_at and amounts
  if (body.status === 'paid' && !body.paid_at) {
    updates.paid_at = new Date().toISOString()
    if (!('amount_paid' in body)) updates.amount_paid = invoice.total
    if (!('amount_due' in body)) updates.amount_due = 0
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
