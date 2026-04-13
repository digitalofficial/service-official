import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { getPortalUserWithPermissions } from '@/lib/portal/permissions'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await getPortalUserWithPermissions(request)
    if (!result) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { portalUser } = result
    const supabase = createServiceRoleClient()
    const body = await request.json()

    // Verify change request belongs to this portal user and is still pending
    const { data: existing } = await supabase
      .from('change_requests')
      .select('*')
      .eq('id', params.id)
      .eq('submitted_by', portalUser.id)
      .single()

    if (!existing) return NextResponse.json({ error: 'Change request not found' }, { status: 404 })
    if (existing.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending change requests can be edited' }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (body.title?.trim()) updates.title = body.title.trim()
    if (body.description !== undefined) updates.description = body.description?.trim() || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('change_requests')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
