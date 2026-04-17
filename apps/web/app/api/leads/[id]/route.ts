import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

const updateSchema = z.object({
  customer_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiating', 'won', 'lost', 'unqualified']).optional(),
  estimated_value: z.number().nullable().optional(),
  source: z.string().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  follow_up_date: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      customer:customers(id, first_name, last_name, company_name, email, phone),
      assignee:profiles!assigned_to(id, first_name, last_name, avatar_url)
    `)
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const body = await request.json()
  const validated = updateSchema.parse(body)

  const { data, error } = await supabase
    .from('leads')
    .update({ ...validated, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
    .select(`
      *,
      customer:customers(id, first_name, last_name, company_name, email, phone),
      assignee:profiles!assigned_to(id, first_name, last_name, avatar_url)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
