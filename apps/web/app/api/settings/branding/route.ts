import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function PATCH(request: NextRequest) {
  const result = await getApiProfile({ requireRole: ['owner', 'admin'] })
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { logo_url, primary_color, secondary_color } = await request.json()

  const { error } = await supabase
    .from('organizations')
    .update({ logo_url, primary_color, secondary_color })
    .eq('id', profile.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
