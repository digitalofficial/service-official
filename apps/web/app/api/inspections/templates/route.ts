import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  trade: z.string().optional(),
  category: z.string().optional(),
  sections: z.array(z.object({
    name: z.string().min(1),
    items: z.array(z.object({
      label: z.string().min(1),
      type: z.enum(['checkbox', 'pass_fail', 'text', 'number', 'photo', 'signature', 'select']).default('checkbox'),
      is_required: z.boolean().default(false),
      options: z.array(z.string()).optional(),
    })),
  })).optional(),
})

export async function GET(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  // Get both system templates and org templates
  const { data, error } = await supabase
    .from('inspection_templates')
    .select('*')
    .or(`organization_id.eq.${profile.organization_id},is_system.eq.true`)
    .eq('is_active', true)
    .order('is_system', { ascending: false })
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

  const body = await request.json()
  const validated = templateSchema.parse(body)
  const { sections, ...templateData } = validated

  // Create template
  const { data: template, error } = await supabase
    .from('inspection_templates')
    .insert({
      ...templateData,
      organization_id: profile.organization_id,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create sections and items
  if (sections?.length) {
    for (let si = 0; si < sections.length; si++) {
      const section = sections[si]
      const { data: sec } = await supabase
        .from('template_sections')
        .insert({ template_id: template.id, name: section.name, order_index: si })
        .select()
        .single()

      if (sec && section.items?.length) {
        await supabase.from('template_items').insert(
          section.items.map((item, ii) => ({
            template_id: template.id,
            section_id: sec.id,
            label: item.label,
            type: item.type,
            is_required: item.is_required,
            options: item.options ? JSON.stringify(item.options) : null,
            order_index: ii,
          }))
        )
      }
    }
  }

  return NextResponse.json({ data: template, success: true }, { status: 201 })
}
