import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await getApiProfile()
    if ('error' in result) return result.error
    const { profile } = result

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('change_requests')
      .select('*, submitted_by_user:portal_users!submitted_by(id, email, company_name, role), reviewed_by_user:profiles!reviewed_by(id, first_name, last_name)')
      .eq('project_id', params.id)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await getApiProfile()
    if ('error' in result) return result.error
    const { profile } = result

    const body = await request.json()
    const { change_request_id, status, review_notes } = body

    if (!change_request_id) return NextResponse.json({ error: 'change_request_id is required' }, { status: 400 })
    if (!status || !['approved', 'rejected', 'in_review'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required (approved, rejected, in_review)' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('change_requests')
      .update({
        status,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        review_notes: review_notes?.trim() || null,
      })
      .eq('id', change_request_id)
      .eq('organization_id', profile.organization_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Change request not found' }, { status: 404 })

    return NextResponse.json({ data, success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
