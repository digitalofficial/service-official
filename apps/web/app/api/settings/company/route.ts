import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function PATCH(request: NextRequest) {
  const result = await getApiProfile({ requireRole: ['owner', 'admin'] })
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const body = await request.json()
  const allowed = ['name', 'industry', 'phone', 'email', 'website', 'timezone', 'address_line1', 'city', 'state', 'zip']
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key] || null
  }

  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', profile.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
