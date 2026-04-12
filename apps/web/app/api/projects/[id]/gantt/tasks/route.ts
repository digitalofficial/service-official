import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

const taskSchema = z.object({
  name: z.string().min(1),
  start_date: z.string(),
  end_date: z.string(),
  phase_id: z.string().uuid().optional(),
  milestone_id: z.string().uuid().optional(),
  parent_task_id: z.string().uuid().optional(),
  progress: z.number().min(0).max(100).default(0),
  is_milestone: z.boolean().default(false),
  assigned_to: z.string().uuid().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const body = await request.json()
  const validated = taskSchema.parse(body)

  // Get next order_index
  const { data: existing } = await supabase
    .from('gantt_tasks')
    .select('order_index')
    .eq('project_id', params.id)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextIndex = existing?.[0] ? existing[0].order_index + 1 : 0

  const { data, error } = await supabase
    .from('gantt_tasks')
    .insert({ ...validated, project_id: params.id, organization_id: profile.organization_id, order_index: nextIndex })
    .select('*, assignee:profiles!assigned_to(first_name, last_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, success: true }, { status: 201 })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { supabase } = result

  const body = await request.json()
  const { task_id, ...updates } = body
  if (!task_id) return NextResponse.json({ error: 'task_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('gantt_tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', task_id)
    .eq('project_id', params.id)
    .select('*, assignee:profiles!assigned_to(first_name, last_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, success: true })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { supabase } = result

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('task_id')
  if (!taskId) return NextResponse.json({ error: 'task_id required' }, { status: 400 })

  const { error } = await supabase
    .from('gantt_tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('project_id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
