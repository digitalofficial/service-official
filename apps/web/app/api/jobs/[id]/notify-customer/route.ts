import { NextRequest, NextResponse } from 'next/server'
import { notifyCustomer } from '@/lib/sms'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile } = result

  const body = await request.json()
  const { type, message } = body // type: 'booked' | 'on_the_way' | 'completed' | 'custom'

  if (!type) return NextResponse.json({ error: 'type is required' }, { status: 400 })

  const smsResult = await notifyCustomer(profile.organization_id, params.id, type, message)

  if (!smsResult.success) {
    return NextResponse.json({ error: smsResult.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, sid: smsResult.sid })
}
