import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

const lineItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().optional(),
  unit_cost: z.number().min(0),
  project_material_id: z.string().uuid().optional(),
  catalog_material_id: z.string().uuid().optional(),
  notes: z.string().optional(),
})

const poSchema = z.object({
  project_id: z.string().uuid().optional(),
  vendor_id: z.string().uuid().optional(),
  title: z.string().optional(),
  issue_date: z.string().default(() => new Date().toISOString().split('T')[0]),
  expected_delivery: z.string().optional(),
  tax_rate: z.number().min(0).default(0),
  shipping_cost: z.number().min(0).default(0),
  payment_terms: z.string().optional(),
  shipping_address: z.string().optional(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
  requires_approval: z.boolean().default(false),
  line_items: z.array(lineItemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { searchParams } = new URL(request.url)

  let query = supabase
    .from('purchase_orders')
    .select('*, vendor:vendors(id, name), project:projects(id, name)')
    .eq('organization_id', profile.organization_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (searchParams.get('status')) query = query.eq('status', searchParams.get('status')!)
  if (searchParams.get('project_id')) query = query.eq('project_id', searchParams.get('project_id')!)
  if (searchParams.get('vendor_id')) query = query.eq('vendor_id', searchParams.get('vendor_id')!)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const result = await getApiProfile({ requireRole: ['owner', 'admin', 'office_manager', 'project_manager'] })
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

  const body = await request.json()
  const validated = poSchema.parse(body)
  const { line_items, ...poData } = validated

  // Generate PO number
  const year = new Date().getFullYear()
  const { data: lastPo } = await supabase
    .from('purchase_orders')
    .select('po_number')
    .eq('organization_id', profile.organization_id)
    .like('po_number', `PO-${year}-%`)
    .order('created_at', { ascending: false })
    .limit(1)

  let seq = 1
  if (lastPo?.[0]) {
    const parts = lastPo[0].po_number.split('-')
    seq = parseInt(parts[2] || '0') + 1
  }
  const poNumber = `PO-${year}-${String(seq).padStart(4, '0')}`

  // Calculate totals
  const items = line_items.map((li, i) => ({
    ...li,
    total: Math.round(li.quantity * li.unit_cost * 100) / 100,
    order_index: i,
  }))
  const subtotal = items.reduce((sum, li) => sum + li.total, 0)
  const taxAmount = Math.round(subtotal * (poData.tax_rate / 100) * 100) / 100
  const total = subtotal + taxAmount + (poData.shipping_cost || 0)

  // Insert PO
  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .insert({
      ...poData,
      organization_id: profile.organization_id,
      po_number: poNumber,
      status: poData.requires_approval ? 'pending_approval' : 'draft',
      subtotal,
      tax_amount: taxAmount,
      total,
      created_by: user.id,
    })
    .select()
    .single()

  if (poError) return NextResponse.json({ error: poError.message }, { status: 500 })

  // Insert line items
  const { error: liError } = await supabase
    .from('po_line_items')
    .insert(items.map(li => ({
      purchase_order_id: po.id,
      name: li.name,
      description: li.description,
      sku: li.sku,
      quantity: li.quantity,
      unit: li.unit,
      unit_cost: li.unit_cost,
      total: li.total,
      order_index: li.order_index,
      notes: li.notes,
      project_material_id: li.project_material_id,
      catalog_material_id: li.catalog_material_id,
    })))

  if (liError) return NextResponse.json({ error: liError.message }, { status: 500 })

  return NextResponse.json({ data: { ...po, po_number: poNumber }, success: true }, { status: 201 })
}
