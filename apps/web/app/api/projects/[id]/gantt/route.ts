import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

  // Verify project
  const { data: project } = await supabase.from('projects').select('id').eq('id', params.id).eq('organization_id', profile!.organization_id).single()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const [tasksRes, depsRes] = await Promise.all([
    supabase
      .from('gantt_tasks')
      .select('*, assignee:profiles!assigned_to(first_name, last_name, avatar_url)')
      .eq('project_id', params.id)
      .order('order_index'),
    supabase
      .from('gantt_dependencies')
      .select('*')
      .eq('project_id', params.id),
  ])

  return NextResponse.json({
    data: {
      tasks: tasksRes.data || [],
      dependencies: depsRes.data || [],
    }
  })
}
