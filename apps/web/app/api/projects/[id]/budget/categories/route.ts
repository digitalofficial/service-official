import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['materials', 'labor', 'equipment', 'subcontractor', 'permits', 'fuel', 'overhead', 'contingency', 'other']),
  budgeted_amount: z.number().min(0),
  description: z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()
  if (!['owner', 'admin', 'office_manager', 'project_manager'].includes(profile!.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json()
  const validated = categorySchema.parse(body)

  // Get next order_index
  const { data: existing } = await supabase
    .from('budget_categories')
    .select('order_index')
    .eq('project_id', params.id)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextIndex = existing?.[0] ? existing[0].order_index + 1 : 0

  const { data, error } = await supabase
    .from('budget_categories')
    .insert({
      ...validated,
      project_id: params.id,
      order_index: nextIndex,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, success: true }, { status: 201 })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { category_id, ...updates } = body

  if (!category_id) return NextResponse.json({ error: 'category_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('budget_categories')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', category_id)
    .eq('project_id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, success: true })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('category_id')
  if (!categoryId) return NextResponse.json({ error: 'category_id required' }, { status: 400 })

  const { error } = await supabase
    .from('budget_categories')
    .delete()
    .eq('id', categoryId)
    .eq('project_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
