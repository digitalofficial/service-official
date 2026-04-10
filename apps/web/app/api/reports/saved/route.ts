import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 403 })

  try {
    const { data, error } = await supabase
      .from('saved_reports')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data: data ?? [] })
  } catch {
    // Table may not exist yet — return empty
    return NextResponse.json({ data: [] })
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 403 })

  const body = await request.json()
  const { name, slug, filters } = body

  if (!name || !slug) return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })

  try {
    const { data, error } = await supabase
      .from('saved_reports')
      .insert({
        name,
        slug,
        filters: filters ?? {},
        organization_id: profile.organization_id,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data, success: true }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed to save report' }, { status: 500 })
  }
}
