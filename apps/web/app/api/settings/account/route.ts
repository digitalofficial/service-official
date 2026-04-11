import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@service-official/database'

// DELETE /api/settings/account — soft-delete current user's organization (archive all data)
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const serviceClient = createServiceRoleClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get profile + org
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') {
    return NextResponse.json({ error: 'Only the organization owner can delete the account' }, { status: 403 })
  }

  const orgId = profile.organization_id

  // Get org name for confirmation
  const { data: org } = await serviceClient
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single()

  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  // Validate confirmation
  const body = await request.json()
  if (!body.confirm_name || body.confirm_name !== org.name) {
    return NextResponse.json({ error: 'Confirmation name does not match organization name' }, { status: 400 })
  }

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
      await serviceClient.from(table).update({ deleted_at: now }).eq('organization_id', orgId).is('deleted_at', null)
    }

    // Soft-delete profiles and disable auth users
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('organization_id', orgId)

    await serviceClient.from('profiles').update({ deleted_at: now, is_active: false }).eq('organization_id', orgId)

    if (profiles && profiles.length > 0) {
      for (const p of profiles) {
        await serviceClient.auth.admin.updateUserById(p.id, { ban_duration: '876600h' })
      }
    }

    // Soft-delete the organization
    const { error: orgError } = await serviceClient
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
