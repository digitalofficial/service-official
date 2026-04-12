import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

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

// Roles allowed to create each item type
const TYPE_ROLES: Record<string, string[]> = {
  punch_list: ['owner', 'admin', 'office_manager', 'project_manager', 'foreman', 'technician', 'subcontractor'],
  phase: ['owner', 'admin', 'office_manager', 'project_manager'],
  milestone: ['owner', 'admin', 'office_manager', 'project_manager'],
  daily_log: ['owner', 'admin', 'project_manager', 'foreman', 'technician'],
  material: ['owner', 'admin', 'office_manager', 'project_manager', 'foreman'],
  rfi: ['owner', 'admin', 'office_manager', 'project_manager', 'foreman', 'technician', 'subcontractor'],
  change_order: ['owner', 'admin', 'office_manager', 'project_manager'],
  submittal: ['owner', 'admin', 'office_manager', 'project_manager', 'foreman', 'subcontractor'],
}

export async function POST(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

  const body = await request.json()
  const { type, ...data } = body

  const table = ALLOWED_TABLES[type]
  if (!table) return NextResponse.json({ error: `Invalid type: ${type}` }, { status: 400 })
  if (!data.project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 })

  // Enforce role-based access per item type
  const allowedRoles = TYPE_ROLES[type]
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return NextResponse.json({ error: 'You do not have permission to create this item' }, { status: 403 })
  }

  // Add user references where applicable
  if (type === 'daily_log') data.submitted_by = user.id
  if (type === 'punch_list') data.created_by = user.id
  if (type === 'rfi') data.submitted_by = user.id
  if (type === 'change_order') data.created_by = user.id

  // Include organization_id for multi-tenant isolation
  data.organization_id = profile.organization_id

  const { data: itemResult, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: itemResult, success: true }, { status: 201 })
}
