import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@service-official/database'

export async function POST(request: NextRequest, context: any) {
  try {
    // Handle both sync and async params (Next.js 14 vs 16)
    const resolvedParams = context.params?.id ? context.params : await context.params
    const estimateId = resolvedParams?.id

    if (!estimateId) {
      // Fallback: extract from URL
      const url = new URL(request.url)
      const segments = url.pathname.split('/')
      const idIndex = segments.indexOf('estimates') + 1
      const fallbackId = segments[idIndex]
      if (!fallbackId) {
        return NextResponse.json({ error: 'Missing estimate ID' }, { status: 400 })
      }
      return handleApprove(request, fallbackId)
    }

    return handleApprove(request, estimateId)
  } catch (error) {
    console.error('Approve endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleApprove(request: NextRequest, estimateId: string) {
  const supabase = createServiceRoleClient()

  // Fetch estimate
  const { data: estimate, error: fetchError } = await supabase
    .from('estimates')
    .select('id, status, organization_id, estimate_number, total, customer_id')
    .eq('id', estimateId)
    .single()

  if (fetchError || !estimate) {
    console.error('Estimate fetch error:', fetchError, 'ID:', estimateId)
    return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
  }

  // Only allow approval of sent or viewed estimates
  if (!['sent', 'viewed'].includes(estimate.status)) {
    return NextResponse.json({ error: `Cannot approve — status is "${estimate.status}"` }, { status: 400 })
  }

  // Parse body safely
  let signatureUrl: string | undefined
  try {
    const body = await request.json()
    if (body.signature_url && typeof body.signature_url === 'string') {
      // Only store signature if it's not too large (< 500KB to fit in text column)
      if (body.signature_url.length < 500000) {
        signatureUrl = body.signature_url
      }
    }
  } catch {
    // No body or invalid JSON — that's fine, signature is optional
  }

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
    .eq('id', estimateId)
    .select()
    .single()

  if (error) {
    console.error('Estimate update error:', error)
    // Try again without signature in case the column can't handle the data
    if (signatureUrl) {
      const { data: retryData, error: retryError } = await supabase
        .from('estimates')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', estimateId)
        .select()
        .single()

      if (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 500 })
      }
      return NextResponse.json({ data: retryData, success: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Trigger workflow (non-blocking)
  try {
    const { trigger } = await import('@service-official/workflows')
    trigger('estimate.approved')(
      estimate.organization_id, 'estimate', estimateId,
      { estimate_number: estimate.estimate_number, total: estimate.total }
    )
  } catch {}

  return NextResponse.json({ data, success: true })
}
