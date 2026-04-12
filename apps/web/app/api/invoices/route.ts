import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { sendEmail } from '@service-official/notifications'
import { trigger } from '@service-official/workflows'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result
  const { searchParams } = new URL(request.url)

  let query = supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(id, first_name, last_name, company_name, email, phone),
      project:projects(id, name),
      payments(id, amount, status, method, created_at)
    `)
    .eq('organization_id', profile!.organization_id)
    .order('created_at', { ascending: false })

  if (searchParams.get('status')) query = query.eq('status', searchParams.get('status')!)
  if (searchParams.get('customer_id')) query = query.eq('customer_id', searchParams.get('customer_id')!)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result
  const body = await request.json()

  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile!.organization_id)

  const year = new Date().getFullYear()
  const invoice_number = `INV-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

  const { line_items, ...invoiceFields } = body

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      ...invoiceFields,
      invoice_number,
      organization_id: profile!.organization_id,
      created_by: user.id,
      amount_due: body.total ?? 0,
      amount_paid: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert line items
  if (line_items?.length) {
    const items = line_items.map((item: any, idx: number) => ({
      invoice_id: data.id,
      name: item.name,
      description: item.description || null,
      quantity: item.quantity ?? 1,
      unit: item.unit || null,
      unit_cost: item.unit_cost ?? 0,
      total: item.total ?? (item.quantity ?? 1) * (item.unit_cost ?? 0),
      is_taxable: item.is_taxable ?? true,
      order_index: item.order_index ?? idx,
    }))

    const { error: itemsError } = await supabase
      .from('invoice_line_items')
      .insert(items)

    if (itemsError) {
      console.error('Failed to insert line items:', itemsError.message)
    }
  }

  return NextResponse.json({ data, success: true }, { status: 201 })
}
