import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

// GET /api/activity — fetch all outbound messages (email + sms) across all conversations
export async function GET(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { searchParams } = new URL(request.url)

  const channel = searchParams.get('channel') // 'sms' | 'email' | null (all)
  const status = searchParams.get('status')   // 'sent' | 'failed' | null (all)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  let query = supabase
    .from('messages')
    .select(`
      id, direction, channel, body, status, sent_at, delivered_at, read_at, sent_by,
      conversation:conversations!inner(
        id, customer_id,
        customer:customers(id, first_name, last_name, company_name, email, phone)
      )
    `, { count: 'exact' })
    .eq('organization_id', profile.organization_id)
    .eq('direction', 'outbound')
    .order('sent_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (channel) query = query.eq('channel', channel)
  if (status) query = query.eq('status', status)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count })
}
