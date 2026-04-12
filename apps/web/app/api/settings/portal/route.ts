import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { DEFAULT_PORTAL_PERMISSIONS } from '@/lib/portal/permissions'

export async function GET() {
  const result = await getApiProfile({ requireRole: ['owner', 'admin'] })
  if ('error' in result) return result.error
  const { profile, supabase } = result

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
  const result = await getApiProfile({ requireRole: ['owner', 'admin'] })
  if ('error' in result) return result.error
  const { profile, supabase } = result

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
