import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

const depSchema = z.object({
  predecessor_id: z.string().uuid(),
  successor_id: z.string().uuid(),
  dependency_type: z.enum(['FS', 'FF', 'SS', 'SF']).default('FS'),
  lag_days: z.number().int().default(0),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { supabase } = result

  const body = await request.json()
  const validated = depSchema.parse(body)

  if (validated.predecessor_id === validated.successor_id) {
    return NextResponse.json({ error: 'Cannot create self-dependency' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('gantt_dependencies')
    .insert({ ...validated, project_id: params.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, success: true }, { status: 201 })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { supabase } = result

  const { searchParams } = new URL(request.url)
  const depId = searchParams.get('dep_id')
  if (!depId) return NextResponse.json({ error: 'dep_id required' }, { status: 400 })

  const { error } = await supabase
    .from('gantt_dependencies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', depId)
    .eq('project_id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
