import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { sendPushNotifications } from '@service-official/notifications'

// POST /api/notifications/push — send push notification to a user
export async function POST(request: NextRequest) {
  const result = await getApiProfile({ requireRole: ['owner', 'admin', 'office_manager', 'project_manager', 'dispatcher'] })
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const body = await request.json()
  const { user_id, title, body: messageBody, data } = body

  if (!user_id || !title || !messageBody) {
    return NextResponse.json({ error: 'user_id, title, and body are required' }, { status: 400 })
  }

  // Get target user's push token
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', user_id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!targetProfile?.push_token) {
    return NextResponse.json({ error: 'User has no push token registered' }, { status: 404 })
  }

  const pushResult = await sendPushNotifications([{
    to: targetProfile.push_token,
    title,
    body: messageBody,
    data: data ?? {},
  }])

  return NextResponse.json({ success: true, result: pushResult })
}
