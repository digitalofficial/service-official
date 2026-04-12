import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { supabase } = result

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
