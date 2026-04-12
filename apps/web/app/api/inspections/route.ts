import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

const inspectionSchema = z.object({
  template_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  job_id: z.string().uuid().optional(),
  equipment_id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  scheduled_date: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  location: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { searchParams } = new URL(request.url)

  let query = supabase
    .from('inspections')
    .select('*, assignee:profiles!assigned_to(first_name, last_name), project:projects(id, name), template:inspection_templates(name)')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (searchParams.get('status')) query = query.eq('status', searchParams.get('status')!)
  if (searchParams.get('project_id')) query = query.eq('project_id', searchParams.get('project_id')!)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

  const body = await request.json()
  const validated = inspectionSchema.parse(body)

  // Generate inspection number
  const year = new Date().getFullYear()
  const { data: last } = await supabase
    .from('inspections')
    .select('inspection_number')
    .eq('organization_id', profile.organization_id)
    .like('inspection_number', `INS-${year}-%`)
    .order('created_at', { ascending: false })
    .limit(1)

  let seq = 1
  if (last?.[0]) {
    const parts = last[0].inspection_number!.split('-')
    seq = parseInt(parts[2] || '0') + 1
  }
  const inspectionNumber = `INS-${year}-${String(seq).padStart(4, '0')}`

  // Create inspection
  const { data: inspection, error } = await supabase
    .from('inspections')
    .insert({
      ...validated,
      organization_id: profile.organization_id,
      inspection_number: inspectionNumber,
      status: 'scheduled',
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If template_id, copy template items into inspection_items
  if (validated.template_id) {
    const { data: sections } = await supabase
      .from('template_sections')
      .select('*, items:template_items(*)')
      .eq('template_id', validated.template_id)
      .order('order_index')

    const inspectionItems: any[] = []
    let globalIndex = 0

    for (const section of sections || []) {
      for (const item of (section.items || []).sort((a: any, b: any) => a.order_index - b.order_index)) {
        inspectionItems.push({
          inspection_id: inspection.id,
          template_item_id: item.id,
          section_name: section.name,
          label: item.label,
          type: item.type,
          is_required: item.is_required,
          order_index: globalIndex++,
          status: 'pending',
        })
      }
    }

    if (inspectionItems.length > 0) {
      await supabase.from('inspection_items').insert(inspectionItems)
      await supabase.from('inspections').update({ total_items: inspectionItems.length }).eq('id', inspection.id)
    }
  }

  return NextResponse.json({ data: inspection, success: true }, { status: 201 })
}
