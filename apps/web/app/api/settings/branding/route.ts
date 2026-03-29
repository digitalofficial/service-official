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
    return NextResponse.json({ error: 'Only owners and admins can update branding' }, { status: 403 })
  }

  const { logo_url, primary_color, secondary_color } = await request.json()

  const { error } = await supabase
    .from('organizations')
    .update({ logo_url, primary_color, secondary_color })
    .eq('id', profile!.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
