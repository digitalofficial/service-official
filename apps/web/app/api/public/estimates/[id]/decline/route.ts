import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'

export async function POST(request: NextRequest, context: any) {
  try {
    const resolvedParams = context.params?.id ? context.params : await context.params
    const estimateId = resolvedParams?.id

    if (!estimateId) {
      const url = new URL(request.url)
      const segments = url.pathname.split('/')
      const idIndex = segments.indexOf('estimates') + 1
      const fallbackId = segments[idIndex]
      if (!fallbackId) return NextResponse.json({ error: 'Missing estimate ID' }, { status: 400 })
      return handleDecline(request, fallbackId)
    }

    return handleDecline(request, estimateId)
  } catch (error) {
    console.error('Decline endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleDecline(request: NextRequest, estimateId: string) {
  const supabase = createServiceRoleClient()

  const { data: estimate } = await supabase
    .from('estimates')
    .select('id, status')
    .eq('id', estimateId)
    .single()

  if (!estimate) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })

  if (!['sent', 'viewed'].includes(estimate.status)) {
    return NextResponse.json({ error: `Cannot decline — status is "${estimate.status}"` }, { status: 400 })
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
      ...(reason ? { notes: `Declined: ${reason}` } : {}),
    })
    .eq('id', estimateId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, success: true })
}
