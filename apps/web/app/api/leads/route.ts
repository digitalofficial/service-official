import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

const leadSchema = z.object({
  customer_id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiating', 'won', 'lost', 'unqualified']).default('new'),
  estimated_value: z.number().optional(),
  source: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  follow_up_date: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

export async function GET(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { searchParams } = new URL(request.url)

  let query = supabase
    .from('leads')
    .select(`
      *,
      customer:customers(id, first_name, last_name, company_name),
      assignee:profiles!assigned_to(id, first_name, last_name, avatar_url)
    `)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (searchParams.get('status')) query = query.eq('status', searchParams.get('status')!)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

  const body = await request.json()
  const validated = leadSchema.parse(body)

  const { data, error } = await supabase
    .from('leads')
    .insert({ ...validated, organization_id: profile.organization_id, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, success: true }, { status: 201 })
}
