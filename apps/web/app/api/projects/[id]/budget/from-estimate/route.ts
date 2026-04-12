import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile({ requireRole: ['owner', 'admin', 'office_manager', 'project_manager'] })
  if ('error' in result) return result.error
  const { supabase } = result

  const body = await request.json()
  const { estimate_id } = body

  if (!estimate_id) return NextResponse.json({ error: 'estimate_id required' }, { status: 400 })

  // Fetch the estimate with sections and line items
  const { data: estimate } = await supabase
    .from('estimates')
    .select('*, sections:estimate_sections(*, line_items:estimate_line_items(*))')
    .eq('id', estimate_id)
    .single()

  if (!estimate) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })

  // Check if budget categories already exist for this project
  const { data: existing } = await supabase
    .from('budget_categories')
    .select('id')
    .eq('project_id', params.id)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Budget categories already exist. Delete existing categories first.' }, { status: 400 })
  }

  // Create budget categories from estimate sections
  const categories = []
  const sections = estimate.sections || []

  if (sections.length > 0) {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]
      const sectionTotal = (section.line_items || [])
        .filter((li: any) => !li.is_optional)
        .reduce((sum: number, li: any) => sum + (li.quantity * li.unit_cost * (1 + (li.markup_percent || 0) / 100)), 0)

      categories.push({
        project_id: params.id,
        name: section.name,
        type: 'other' as const,
        budgeted_amount: Math.round(sectionTotal * 100) / 100,
        description: `Auto-generated from estimate ${estimate.estimate_number || ''}`,
        order_index: i,
      })
    }
  } else {
    // No sections — create a single category from total
    categories.push({
      project_id: params.id,
      name: estimate.title || 'Project Budget',
      type: 'other' as const,
      budgeted_amount: estimate.total || 0,
      description: `Auto-generated from estimate ${estimate.estimate_number || ''}`,
      order_index: 0,
    })
  }

  const { data, error } = await supabase
    .from('budget_categories')
    .insert(categories)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, success: true, count: data.length }, { status: 201 })
}
