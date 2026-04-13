import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await getApiProfile()
    if ('error' in result) return result.error
    const { profile, supabase } = result

    const { data, error } = await supabase
      .from('subcontractors')
      .select('*')
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 })

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await getApiProfile({ requireRole: ['owner', 'admin', 'office_manager', 'project_manager'] })
    if ('error' in result) return result.error
    const { profile, supabase } = result

    const body = await request.json()

    const { data, error } = await supabase
      .from('subcontractors')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 })

    return NextResponse.json({ data, success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await getApiProfile({ requireRole: ['owner', 'admin', 'office_manager'] })
    if ('error' in result) return result.error
    const { profile, supabase } = result

    // Soft delete: set is_active = false
    const { data, error } = await supabase
      .from('subcontractors')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
