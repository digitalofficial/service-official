import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceRoleClient()

  const { data: estimate } = await supabase
    .from('estimates')
    .select('id, status')
    .eq('id', params.id)
    .single()

  if (!estimate) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })

  if (!['sent', 'viewed'].includes(estimate.status)) {
    return NextResponse.json({ error: `Estimate cannot be declined (current status: ${estimate.status})` }, { status: 400 })
  }

  let reason: string | undefined
  try {
    const body = await request.json()
    reason = body.reason
  } catch {}

  const { data, error } = await supabase
    .from('estimates')
    .update({
      status: 'declined',
      notes: reason ? `Declined: ${reason}` : undefined,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, success: true })
}
