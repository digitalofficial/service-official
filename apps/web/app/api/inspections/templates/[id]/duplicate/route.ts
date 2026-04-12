import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

  // Get original template
  const { data: original } = await supabase
    .from('inspection_templates')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!original) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  // Create copy
  const { data: copy, error } = await supabase
    .from('inspection_templates')
    .insert({
      organization_id: profile.organization_id,
      name: `${original.name} (Copy)`,
      description: original.description,
      trade: original.trade,
      category: original.category,
      is_system: false,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Copy sections and items
  const { data: sections } = await supabase
    .from('template_sections')
    .select('*, items:template_items(*)')
    .eq('template_id', params.id)
    .order('order_index')

  for (const section of sections || []) {
    const { data: newSection } = await supabase
      .from('template_sections')
      .insert({ template_id: copy.id, name: section.name, description: section.description, order_index: section.order_index })
      .select()
      .single()

    if (newSection && section.items?.length) {
      await supabase.from('template_items').insert(
        section.items.map((item: any) => ({
          template_id: copy.id,
          section_id: newSection.id,
          label: item.label,
          description: item.description,
          type: item.type,
          is_required: item.is_required,
          options: item.options,
          order_index: item.order_index,
        }))
      )
    }
  }

  return NextResponse.json({ data: copy, success: true }, { status: 201 })
}
