import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { item_id, ...updates } = body

  if (!item_id) return NextResponse.json({ error: 'item_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('inspection_items')
    .update({
      ...updates,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', item_id)
    .eq('inspection_id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update inspection status to in_progress if still scheduled
  await supabase
    .from('inspections')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('status', 'scheduled')

  return NextResponse.json({ data, success: true })
}
