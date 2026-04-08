import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@service-official/database'

// DELETE /api/settings/account — permanently delete current user's organization
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
    // Get all profiles for this org
    const { data: profiles } = await serviceClient
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
      await serviceClient.from(table).delete().eq('organization_id', orgId)
    }

    // Delete profiles
    await serviceClient.from('profiles').delete().eq('organization_id', orgId)

    // Delete auth users
    if (profiles && profiles.length > 0) {
      for (const p of profiles) {
        await serviceClient.auth.admin.deleteUser(p.id)
      }
    }

    // Delete the organization
    const { error: orgError } = await serviceClient
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
