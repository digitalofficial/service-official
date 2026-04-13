import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await getApiProfile()
    if ('error' in result) return result.error
    const { profile } = result

    const supabase = createServiceRoleClient()

    const { data: messages, error } = await supabase
      .from('portal_messages')
      .select('*, portal_user:portal_users(id, email, company_name, role), staff_user:profiles!portal_messages_staff_user_id_fkey(id, first_name, last_name)')
      .eq('project_id', params.id)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: true })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: messages })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await getApiProfile()
    if ('error' in result) return result.error
    const { profile } = result

    const body = await request.json()
    if (!body.message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('portal_messages')
      .insert({
        organization_id: profile.organization_id,
        project_id: params.id,
        staff_user_id: profile.id,
        direction: 'staff_to_client',
        body: body.message.trim(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
