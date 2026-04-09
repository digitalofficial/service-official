import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: inspection, error } = await supabase
    .from('inspections')
    .select('*, assignee:profiles!assigned_to(first_name, last_name), project:projects(id, name), template:inspection_templates(name)')
    .eq('id', params.id)
    .single()

  if (error || !inspection) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: items } = await supabase
    .from('inspection_items')
    .select('*')
    .eq('inspection_id', params.id)
    .order('order_index')

  return NextResponse.json({ data: { ...inspection, items: items || [] } })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('inspections')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, success: true })
}
