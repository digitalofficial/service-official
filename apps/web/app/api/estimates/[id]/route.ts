import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

const lineItemSchema = z.object({
  section_id: z.string().uuid().optional(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().default(1),
  unit: z.string().optional(),
  unit_cost: z.number().default(0),
  markup_percent: z.number().default(0),
  is_optional: z.boolean().default(false),
  is_taxable: z.boolean().default(true),
  order_index: z.number().default(0),
})

const estimateUpdateSchema = z.object({
  project_id: z.string().uuid().optional().nullable(),
  customer_id: z.string().uuid().optional().nullable(),
  job_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional(),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  discount_type: z.enum(['percent', 'fixed']).optional(),
  discount_value: z.number().default(0),
  tax_rate: z.number().default(0),
  terms: z.string().optional(),
  notes: z.string().optional(),
  sections: z.array(z.object({ name: z.string(), order_index: z.number() })).default([]),
  line_items: z.array(lineItemSchema).default([]),
})

function calculateTotals(lineItems: any[], discountType: string | undefined, discountValue: number, taxRate: number) {
  const subtotal = lineItems
    .filter(i => !i.is_optional)
    .reduce((sum, item) => {
      const base = item.quantity * item.unit_cost
      const markup = base * (item.markup_percent / 100)
      return sum + base + markup
    }, 0)

  const discountAmount = discountType === 'percent'
    ? subtotal * (discountValue / 100)
    : discountValue

  const taxable = lineItems
    .filter(i => i.is_taxable && !i.is_optional)
    .reduce((sum, i) => sum + i.quantity * i.unit_cost * (1 + i.markup_percent / 100), 0)

  const taxAmount = (taxable - (discountType === 'percent' ? taxable * discountValue / 100 : 0)) * (taxRate / 100)
  const total = subtotal - discountAmount + taxAmount

  return { subtotal, discount_amount: discountAmount, tax_amount: taxAmount, total }
}

// GET /api/estimates/[id] — fetch single estimate with line items and sections
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { data: estimate, error } = await supabase
    .from('estimates')
    .select(`
      *,
      customer:customers(id, first_name, last_name, company_name),
      project:projects(id, name),
      line_items:estimate_line_items(*),
      sections:estimate_sections(*)
    `)
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)
    .is('deleted_at', null)
    .single()

  if (error || !estimate) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })

  return NextResponse.json({ data: estimate })
}

// PATCH /api/estimates/[id] — update estimate fields + replace line items
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  // Verify estimate belongs to org and is editable
  const { data: existing } = await supabase
    .from('estimates')
    .select('id, organization_id, status')
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)
    .is('deleted_at', null)
    .single()

  if (!existing) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
  if (!['draft', 'sent'].includes(existing.status)) {
    return NextResponse.json({ error: 'Only draft or sent estimates can be edited' }, { status: 400 })
  }

  const body = await request.json()
  const { sections, line_items, ...estimateData } = estimateUpdateSchema.parse(body)

  const totals = calculateTotals(line_items, estimateData.discount_type, estimateData.discount_value, estimateData.tax_rate)

  // Update estimate
  const { error: updateError } = await supabase
    .from('estimates')
    .update({
      ...estimateData,
      ...totals,
    })
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Delete existing line items and sections, then re-insert
  await supabase.from('estimate_line_items').delete().eq('estimate_id', params.id)
  await supabase.from('estimate_sections').delete().eq('estimate_id', params.id)

  // Insert sections
  const sectionMap: Record<string, string> = {}
  if (sections.length > 0) {
    const { data: createdSections } = await supabase
      .from('estimate_sections')
      .insert(sections.map(s => ({ ...s, estimate_id: params.id })))
      .select()
    createdSections?.forEach((s, i) => { sectionMap[sections[i].name] = s.id })
  }

  // Insert line items
  if (line_items.length > 0) {
    await supabase.from('estimate_line_items').insert(
      line_items.map(item => ({
        ...item,
        estimate_id: params.id,
        total: item.quantity * item.unit_cost * (1 + item.markup_percent / 100),
      }))
    )
  }

  // Fetch updated estimate
  const { data: updated } = await supabase
    .from('estimates')
    .select('*')
    .eq('id', params.id)
    .single()

  return NextResponse.json({ data: updated, success: true })
}

// DELETE /api/estimates/[id] — soft delete
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  // Verify estimate belongs to org
  const { data: existing } = await supabase
    .from('estimates')
    .select('id, organization_id')
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)
    .is('deleted_at', null)
    .single()

  if (!existing) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })

  const { error } = await supabase
    .from('estimates')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('organization_id', profile!.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
