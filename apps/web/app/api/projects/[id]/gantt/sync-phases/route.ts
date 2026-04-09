import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get phases
  const { data: phases } = await supabase
    .from('project_phases')
    .select('*')
    .eq('project_id', params.id)
    .order('order_index')

  if (!phases?.length) return NextResponse.json({ error: 'No phases to sync' }, { status: 400 })

  // Get existing gantt tasks linked to phases
  const { data: existingTasks } = await supabase
    .from('gantt_tasks')
    .select('phase_id')
    .eq('project_id', params.id)
    .not('phase_id', 'is', null)

  const linkedPhaseIds = new Set(existingTasks?.map(t => t.phase_id) || [])

  // Create tasks for unlinked phases
  const newTasks = phases
    .filter(p => !linkedPhaseIds.has(p.id) && p.start_date && p.end_date)
    .map((p, i) => ({
      project_id: params.id,
      phase_id: p.id,
      name: p.name,
      start_date: p.start_date,
      end_date: p.end_date,
      progress: p.status === 'completed' ? 100 : p.status === 'in_progress' ? 50 : 0,
      color: p.color || null,
      order_index: (existingTasks?.length || 0) + i,
    }))

  if (newTasks.length === 0) {
    return NextResponse.json({ message: 'All phases already synced', count: 0 })
  }

  const { data, error } = await supabase.from('gantt_tasks').insert(newTasks).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, success: true, count: data.length })
}
