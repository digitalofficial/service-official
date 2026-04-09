import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { z } from 'zod'

const customerSchema = z.object({
  type: z.enum(['residential', 'commercial', 'property_manager', 'hoa', 'government']).default('residential'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  email: z.preprocess((v) => (v === '' ? undefined : v), z.string().email().optional()),
  phone: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  tags: z.array(z.string()).default([]),
  source: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const tag = searchParams.get('tag')
  const page = Number(searchParams.get('page') ?? 1)
  const per_page = Number(searchParams.get('per_page') ?? 25)

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('organization_id', profile!.organization_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range((page - 1) * per_page, page * per_page - 1)

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }
  if (tag) query = query.contains('tags', [tag])

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, total: count, page, per_page })
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const body = await request.json()
  const validated = customerSchema.parse(body)

  const { data, error } = await supabase
    .from('customers')
    .insert({ ...validated, organization_id: profile!.organization_id, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, success: true }, { status: 201 })
}
