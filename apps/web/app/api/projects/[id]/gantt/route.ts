import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { canAccessProject } from '@/lib/auth/project-access'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase, user } = result

  // Verify project belongs to org AND that user (if field-scoped role) is assigned
  const { data: project } = await supabase.from('projects').select('id').eq('id', params.id).eq('organization_id', profile.organization_id).single()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const allowed = await canAccessProject(user.id, profile.role, profile.organization_id, params.id)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [tasksRes, depsRes] = await Promise.all([
    supabase
      .from('gantt_tasks')
      .select('*, assignee:profiles!assigned_to(first_name, last_name, avatar_url)')
      .eq('project_id', params.id)
      .is('deleted_at', null)
      .order('order_index'),
    supabase
      .from('gantt_dependencies')
      .select('*')
      .eq('project_id', params.id)
      .is('deleted_at', null),
  ])

  return NextResponse.json({
    data: {
      tasks: tasksRes.data || [],
      dependencies: depsRes.data || [],
    }
  })
}
