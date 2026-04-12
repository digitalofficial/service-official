import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function GET() {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  try {
    const { data, error } = await supabase
      .from('saved_reports')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data: data ?? [] })
  } catch {
    // Table may not exist yet — return empty
    return NextResponse.json({ data: [] })
  }
}

export async function POST(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

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
