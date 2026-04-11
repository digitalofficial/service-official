import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

const DEFAULT_EXPORT_ROLES = ['owner', 'admin']

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'No profile' }, { status: 403 })

  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', profile.organization_id)
    .single()

  const roles = (org?.settings as any)?.export_allowed_roles ?? DEFAULT_EXPORT_ROLES

  return NextResponse.json({ roles, user_can_export: roles.includes(profile.role) })
}

export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()
  if (!['owner', 'admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Only owners and admins can update export permissions' }, { status: 403 })
  }

  const { roles } = await request.json()
  if (!Array.isArray(roles)) return NextResponse.json({ error: 'roles must be an array' }, { status: 400 })

  // Owner always has export permission
  const finalRoles = Array.from(new Set(['owner', ...roles]))

  // Get current settings, merge
  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', profile!.organization_id)
    .single()

  const currentSettings = (org?.settings as Record<string, unknown>) ?? {}

  const { error } = await supabase
    .from('organizations')
    .update({ settings: { ...currentSettings, export_allowed_roles: finalRoles } })
    .eq('id', profile!.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ roles: finalRoles, success: true })
}
