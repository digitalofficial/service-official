import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@service-official/database'

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, role, organization:organizations(name)')
    .eq('id', user.id)
    .single()

  const { message, currentPage } = await request.json()
  const org = (profile as any)?.organization

  // Find super admin(s) in the service-official org
  const serviceClient = createServiceRoleClient()
  const { data: adminOrg } = await serviceClient
    .from('organizations')
    .select('id')
    .eq('slug', 'service-official')
    .single()

  if (!adminOrg) return NextResponse.json({ error: 'Admin org not found' }, { status: 500 })

  const { data: admins } = await serviceClient
    .from('profiles')
    .select('id')
    .eq('organization_id', adminOrg.id)
    .eq('role', 'owner')

  if (!admins?.length) return NextResponse.json({ error: 'No admins found' }, { status: 500 })

  // Create a notification for each super admin
  const notifications = admins.map((admin) => ({
    organization_id: adminOrg.id,
    user_id: admin.id,
    type: 'client_message' as const,
    title: `Alfred: ${profile?.first_name} ${profile?.last_name} needs help`,
    body: `${profile?.first_name} from ${org?.name} requested assistance on ${currentPage}. Message: "${message?.slice(0, 200)}"`,
    entity_type: 'alfred_chat',
    action_url: '/admin',
    data: {
      source: 'alfred',
      user_id: user.id,
      user_email: profile?.email,
      user_name: `${profile?.first_name} ${profile?.last_name}`,
      org_name: org?.name,
      page: currentPage,
      message: message?.slice(0, 500),
    },
  }))

  const { error } = await serviceClient.from('notifications').insert(notifications)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
