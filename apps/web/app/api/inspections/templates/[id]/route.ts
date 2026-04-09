import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: template, error } = await supabase
    .from('inspection_templates')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !template) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: sections } = await supabase
    .from('template_sections')
    .select('*, items:template_items(*)')
    .eq('template_id', params.id)
    .order('order_index')

  return NextResponse.json({ data: { ...template, sections: sections || [] } })
}
