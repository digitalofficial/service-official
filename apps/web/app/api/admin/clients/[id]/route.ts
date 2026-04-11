import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'

function isAdmin(request: NextRequest) {
  return request.headers.get('x-admin-secret') === process.env.ADMIN_SECRET
}

// PATCH /api/admin/clients/[id] — update tier, status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceRoleClient()
  const updates = await request.json()

  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/admin/clients/[id] — soft-delete org and archive all related data
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServiceRoleClient()
  const orgId = params.id

  // Verify org exists
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', orgId)
    .single()

  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  try {
    const now = new Date().toISOString()

    // Soft-delete related data by setting deleted_at
    const tables = [
      'job_reminders',
      'photos',
      'files',
      'expenses',
      'payments',
      'invoices',
      'jobs',
      'conversations',
      'messages',
      'notifications',
      'invitations',
    ]

    for (const table of tables) {
      await supabase.from(table).update({ deleted_at: now }).eq('organization_id', orgId).is('deleted_at', null)
    }

    // Soft-delete profiles and disable auth users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', orgId)

    await supabase.from('profiles').update({ deleted_at: now, is_active: false }).eq('organization_id', orgId)

    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        await supabase.auth.admin.updateUserById(profile.id, { ban_duration: '876600h' })
      }
    }

    // Soft-delete the organization
    const { error: orgError } = await supabase
      .from('organizations')
      .update({ deleted_at: now })
      .eq('id', orgId)

    if (orgError) {
      return NextResponse.json({ error: `Failed to archive organization: ${orgError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Archival failed' }, { status: 500 })
  }
}
