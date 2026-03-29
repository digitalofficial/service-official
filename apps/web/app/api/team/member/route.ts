import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!['owner', 'admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Only owners and admins can edit team members' }, { status: 403 })
  }

  const { id, role, phone, title, hourly_rate, is_active } = await request.json()
  if (!id) return NextResponse.json({ error: 'Member ID required' }, { status: 400 })

  const { error } = await supabase
    .from('profiles')
    .update({
      role,
      phone,
      title,
      hourly_rate,
      is_active,
    })
    .eq('id', id)
    .eq('organization_id', profile!.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
