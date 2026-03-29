import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

// Generic API for creating project sub-items:
// punch_list_items, project_phases, project_milestones, daily_logs,
// project_materials, rfis, change_orders, submittals

const ALLOWED_TABLES: Record<string, string> = {
  punch_list: 'punch_list_items',
  phase: 'project_phases',
  milestone: 'project_milestones',
  daily_log: 'daily_logs',
  material: 'project_materials',
  rfi: 'rfis',
  change_order: 'change_orders',
  submittal: 'submittals',
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { type, ...data } = body

  const table = ALLOWED_TABLES[type]
  if (!table) return NextResponse.json({ error: `Invalid type: ${type}` }, { status: 400 })
  if (!data.project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 })

  // Add user references where applicable
  if (type === 'daily_log') data.submitted_by = user.id
  if (type === 'punch_list') data.created_by = user.id
  if (type === 'rfi') data.submitted_by = user.id
  if (type === 'change_order') data.created_by = user.id

  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: result, success: true }, { status: 201 })
}
