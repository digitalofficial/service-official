import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

// GET /api/profile — get current user's profile
export async function GET() {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, supabase } = result

  const { data, error } = await supabase
    .from('profiles')
    .select('id, organization_id, role, first_name, last_name, email, phone, avatar_url')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// PATCH /api/profile — update current user's profile (notification prefs, reminder prefs)
export async function PATCH(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, supabase } = result

  const body = await request.json()

  // Only allow updating safe fields
  const allowed = [
    'notify_sms', 'notify_email', 'notify_push',
    'reminder_pref_1', 'reminder_pref_2',
    'first_name', 'last_name', 'phone',
  ]

  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
