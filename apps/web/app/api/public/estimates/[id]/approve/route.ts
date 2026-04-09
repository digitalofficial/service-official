import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceRoleClient()

    // Fetch estimate
    const { data: estimate, error: fetchError } = await supabase
      .from('estimates')
      .select('id, status, organization_id, estimate_number, total, customer_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !estimate) {
      console.error('Estimate fetch error:', fetchError)
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

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
    const updateData: Record<string, any> = {
      status: 'approved',
      approved_at: new Date().toISOString(),
    }
    if (signatureUrl) {
      updateData.signature_url = signatureUrl
      updateData.signed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('estimates')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Estimate update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Trigger workflow (non-blocking, don't let it crash the response)
    try {
      const { trigger } = await import('@service-official/workflows')
      trigger('estimate.approved')(
        estimate.organization_id, 'estimate', params.id,
        { estimate_number: estimate.estimate_number, total: estimate.total }
      )
    } catch (e) {
      console.error('Workflow trigger failed (non-critical):', e)
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('Approve endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
