import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

// PATCH /api/invoices/[id] — update invoice (mark paid, adjust amounts, etc.)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile({ requireRole: ['owner', 'admin', 'office_manager'] })
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

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
