import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function POST(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { supabase } = result

  const { project_id, user_id, role, hourly_rate } = await request.json()

  if (!project_id || !user_id) {
    return NextResponse.json({ error: 'project_id and user_id required' }, { status: 400 })
  }

  // Check if already on team
  const { data: existing } = await supabase
    .from('project_team')
    .select('id')
    .eq('project_id', project_id)
    .eq('user_id', user_id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Already on this project team' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('project_team')
    .insert({
      project_id,
      user_id,
      role: role || null,
      hourly_rate: hourly_rate || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, success: true }, { status: 201 })
}
