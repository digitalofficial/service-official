import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function PATCH(req: NextRequest, { params }: { params: { id: string; assignmentId: string } }) {
  const result = await getApiProfile({ requireRole: ['owner', 'admin', 'office_manager', 'project_manager'] })
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const body = await req.json()
  const allowed = ['scope', 'status', 'hours_logged', 'notes']
  const update: any = { updated_at: new Date().toISOString() }
  for (const k of allowed) if (k in body) update[k] = body[k]

  const { data, error } = await supabase
    .from('job_subcontractors')
    .update(update)
    .eq('id', params.assignmentId)
    .eq('job_id', params.id)
    .eq('organization_id', profile.organization_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  return NextResponse.json({ data, success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; assignmentId: string } }) {
  const result = await getApiProfile({ requireRole: ['owner', 'admin', 'office_manager', 'project_manager'] })
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { error } = await supabase
    .from('job_subcontractors')
    .delete()
    .eq('id', params.assignmentId)
    .eq('job_id', params.id)
    .eq('organization_id', profile.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
