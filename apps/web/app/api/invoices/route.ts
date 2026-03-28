import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { sendEmail } from '@service-official/notifications'
import { trigger } from '@service-official/workflows'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
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
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const body = await request.json()

  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', profile!.organization_id)

  const year = new Date().getFullYear()
  const invoice_number = `INV-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      ...body,
      invoice_number,
      organization_id: profile!.organization_id,
      created_by: user.id,
      amount_due: body.total ?? 0,
      amount_paid: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, success: true }, { status: 201 })
}
