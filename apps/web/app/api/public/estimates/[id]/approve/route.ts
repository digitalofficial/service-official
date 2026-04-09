import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'
import { trigger } from '@service-official/workflows'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceRoleClient()

  // Fetch estimate
  const { data: estimate } = await supabase
    .from('estimates')
    .select('id, status, organization_id, estimate_number, total, customer_id')
    .eq('id', params.id)
    .single()

  if (!estimate) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })

  // Only allow approval of sent or viewed estimates
  if (!['sent', 'viewed'].includes(estimate.status)) {
    return NextResponse.json({ error: `Estimate cannot be approved (current status: ${estimate.status})` }, { status: 400 })
  }

  // Parse optional signature
  let signatureUrl: string | undefined
  try {
    const body = await request.json()
    signatureUrl = body.signature_url
  } catch {}

  // Update estimate to approved
  const { data, error } = await supabase
    .from('estimates')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      ...(signatureUrl ? { signature_url: signatureUrl, signed_at: new Date().toISOString() } : {}),
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Trigger workflow
  trigger('estimate.approved')(
    estimate.organization_id, 'estimate', params.id,
    { estimate_number: estimate.estimate_number, total: estimate.total }
  )

  return NextResponse.json({ data, success: true })
}
