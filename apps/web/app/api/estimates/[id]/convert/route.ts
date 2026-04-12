import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

// POST /api/estimates/[id]/convert
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result
  const body = await request.json()
  const { due_days = 30, type = 'standard' } = body

  // Get estimate with line items
  const { data: estimate } = await supabase
    .from('estimates')
    .select('*, sections:estimate_sections(*), line_items:estimate_line_items(*)')
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)
    .single()

  if (!estimate) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['approved', 'sent', 'viewed'].includes(estimate.status)) {
    return NextResponse.json({ error: 'Estimate must be approved or sent before converting' }, { status: 400 })
  }

  // Auto invoice number
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile!.organization_id)

  const year = new Date().getFullYear()
  const invoice_number = `INV-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

  const due_date = new Date()
  due_date.setDate(due_date.getDate() + due_days)

  // Create invoice
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      organization_id: profile!.organization_id,
      project_id: estimate.project_id,
      customer_id: estimate.customer_id,
      job_id: estimate.job_id || null,
      estimate_id: estimate.id,
      invoice_number,
      title: estimate.title,
      type,
      status: 'draft',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: due_date.toISOString().split('T')[0],
      subtotal: estimate.subtotal,
      discount_amount: estimate.discount_amount,
      tax_amount: estimate.tax_amount,
      total: estimate.total,
      amount_paid: 0,
      amount_due: estimate.total,
      terms: estimate.terms,
      notes: estimate.notes,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Copy line items
  if (estimate.line_items?.length) {
    await supabase.from('invoice_line_items').insert(
      estimate.line_items.map((item: any) => ({
        invoice_id: invoice.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.unit_cost,
        total: item.total,
        is_taxable: item.is_taxable,
        order_index: item.order_index,
      }))
    )
  }

  // Mark estimate as converted
  await supabase.from('estimates').update({ status: 'converted' }).eq('id', params.id).eq('organization_id', profile!.organization_id)

  return NextResponse.json({ data: invoice, success: true }, { status: 201 })
}
