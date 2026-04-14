import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { supabase } = result

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
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const body = await request.json()
  const { data, error } = await supabase
    .from('inspections')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, success: true })
}

// Soft delete — sets deleted_at so the inspection drops out of lists
// but stays restorable until a future hard-delete job.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { error } = await supabase
    .from('inspections')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
