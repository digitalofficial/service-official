import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function GET(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, supabase } = result

  const { searchParams } = new URL(request.url)
  const unread_only = searchParams.get('unread_only') === 'true'

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (unread_only) query = query.eq('is_read', false)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const unread_count = data?.filter(n => !n.is_read).length ?? 0
  return NextResponse.json({ data, unread_count })
}

// PATCH /api/notifications — mark all as read
export async function PATCH(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, supabase } = result

  const body = await request.json().catch(() => ({}))
  const { ids } = body // optional: mark specific IDs

  let query = supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (ids?.length) {
    query = query.in('id', ids)
  } else {
    query = query.eq('is_read', false)
  }

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
