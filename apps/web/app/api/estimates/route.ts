import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { trigger } from '@service-official/workflows'
import { sendEmail } from '@service-official/notifications'
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

const estimateSchema = z.object({
  project_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  job_id: z.string().uuid().optional(),
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

export async function GET(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result
  const { searchParams } = new URL(request.url)

  let query = supabase
    .from('estimates')
    .select(`
      *,
      customer:customers(id, first_name, last_name, company_name),
      project:projects(id, name)
    `)
    .eq('organization_id', profile!.organization_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (searchParams.get('status')) query = query.eq('status', searchParams.get('status')!)
  if (searchParams.get('customer_id')) query = query.eq('customer_id', searchParams.get('customer_id')!)
  if (searchParams.get('project_id')) query = query.eq('project_id', searchParams.get('project_id')!)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result
  const body = await request.json()
  const { sections, line_items, ...estimateData } = estimateSchema.parse(body)

  // Auto-number
  const { count } = await supabase
    .from('estimates')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile!.organization_id)

  const year = new Date().getFullYear()
  const estimate_number = `EST-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

  const totals = calculateTotals(line_items, estimateData.discount_type, estimateData.discount_value, estimateData.tax_rate)

  // Create estimate
  const { data: estimate, error: estError } = await supabase
    .from('estimates')
    .insert({
      ...estimateData,
      ...totals,
      estimate_number,
      organization_id: profile!.organization_id,
      created_by: user.id,
      status: 'draft',
      issue_date: estimateData.issue_date ?? new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (estError) return NextResponse.json({ error: estError.message }, { status: 500 })

  // Insert sections
  const sectionMap: Record<string, string> = {}
  if (sections.length > 0) {
    const { data: createdSections } = await supabase
      .from('estimate_sections')
      .insert(sections.map(s => ({ ...s, estimate_id: estimate.id })))
      .select()
    createdSections?.forEach((s, i) => { sectionMap[sections[i].name] = s.id })
  }

  // Insert line items
  if (line_items.length > 0) {
    await supabase.from('estimate_line_items').insert(
      line_items.map(item => ({
        ...item,
        estimate_id: estimate.id,
        total: item.quantity * item.unit_cost * (1 + item.markup_percent / 100),
      }))
    )
  }

  return NextResponse.json({ data: estimate, success: true }, { status: 201 })
}
