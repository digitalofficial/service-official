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
    return NextResponse.json({ error: 'Only owners and admins can update company info' }, { status: 403 })
  }

  const body = await request.json()
  const allowed = ['name', 'industry', 'phone', 'email', 'website', 'timezone', 'address_line1', 'city', 'state', 'zip']
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key] || null
  }

  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', profile!.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
