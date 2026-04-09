import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { DEFAULT_PORTAL_PERMISSIONS } from '@/lib/portal/permissions'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('customer_portal_permissions')
    .eq('id', profile.organization_id)
    .single()

  return NextResponse.json({
    permissions: { ...DEFAULT_PORTAL_PERMISSIONS, ...(org?.customer_portal_permissions ?? {}) },
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { permissions } = body

  // Validate: only allow known permission keys with boolean values
  const validKeys = Object.keys(DEFAULT_PORTAL_PERMISSIONS)
  const sanitized: Record<string, boolean> = {}
  for (const key of validKeys) {
    if (key in permissions && typeof permissions[key] === 'boolean') {
      sanitized[key] = permissions[key]
    }
  }

  const merged = { ...DEFAULT_PORTAL_PERMISSIONS, ...sanitized }

  const { error } = await supabase
    .from('organizations')
    .update({ customer_portal_permissions: merged })
    .eq('id', profile.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, permissions: merged })
}
