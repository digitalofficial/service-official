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

// DELETE /api/admin/clients/[id] — permanently delete org and all related data
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
    // Get all profiles (users) for this org so we can delete auth users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', orgId)

    // Delete related data in dependency order
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
      'organization_sms_settings',
      'organization_domains',
    ]

    for (const table of tables) {
      await supabase.from(table).delete().eq('organization_id', orgId)
    }

    // Delete profiles
    await supabase.from('profiles').delete().eq('organization_id', orgId)

    // Delete auth users
    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        await supabase.auth.admin.deleteUser(profile.id)
      }
    }

    // Delete the organization itself
    const { error: orgError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', orgId)

    if (orgError) {
      return NextResponse.json({ error: `Failed to delete organization: ${orgError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Deletion failed' }, { status: 500 })
  }
}
