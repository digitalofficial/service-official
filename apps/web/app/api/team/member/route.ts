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

  const { id, role, phone, title, hourly_rate, is_active, reminder_pref_1, reminder_pref_2, notify_sms } = await request.json()
  if (!id) return NextResponse.json({ error: 'Member ID required' }, { status: 400 })

  const updates: Record<string, any> = { role, phone, title, hourly_rate, is_active }
  if (reminder_pref_1 !== undefined) updates.reminder_pref_1 = reminder_pref_1
  if (reminder_pref_2 !== undefined) updates.reminder_pref_2 = reminder_pref_2
  if (notify_sms !== undefined) updates.notify_sms = notify_sms

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', profile!.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
