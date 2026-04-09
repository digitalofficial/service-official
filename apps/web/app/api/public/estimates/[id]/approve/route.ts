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

  // Fetch estimate with line items (need them for auto-invoice)
  const { data: estimate, error: fetchError } = await supabase
    .from('estimates')
    .select('*, line_items:estimate_line_items(*)')
    .eq('id', estimateId)
    .single()

  if (fetchError || !estimate) {
    console.error('Estimate fetch error:', fetchError, 'ID:', estimateId)
    return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
  }

  if (!['sent', 'viewed'].includes(estimate.status)) {
    return NextResponse.json({ error: `Cannot approve — status is "${estimate.status}"` }, { status: 400 })
  }

  // Parse signature
  let signatureUrl: string | undefined
  try {
    const body = await request.json()
    if (body.signature_url && typeof body.signature_url === 'string' && body.signature_url.length < 500000) {
      signatureUrl = body.signature_url
    }
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

  const { error } = await supabase
    .from('estimates')
    .update(updateData)
    .eq('id', estimateId)

  if (error) {
    // Retry without signature
    const { error: retryError } = await supabase
      .from('estimates')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', estimateId)

    if (retryError) return NextResponse.json({ error: retryError.message }, { status: 500 })
  }

  // ── Auto-convert to invoice ──────────────────────────────
  let invoice = null
  try {
    // Generate invoice number
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', estimate.organization_id)

    const invoiceNumber = `INV-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30) // Net 30

    // Create invoice from estimate
    const { data: newInvoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        organization_id: estimate.organization_id,
        project_id: estimate.project_id,
        customer_id: estimate.customer_id,
        estimate_id: estimate.id,
        invoice_number: invoiceNumber,
        title: estimate.title,
        type: 'standard',
        status: 'draft', // Ready for contractor to review and send
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        subtotal: estimate.subtotal,
        discount_amount: estimate.discount_amount ?? 0,
        tax_amount: estimate.tax_amount ?? 0,
        total: estimate.total,
        amount_paid: 0,
        amount_due: estimate.total,
        terms: estimate.terms,
        notes: estimate.notes,
      })
      .select()
      .single()

    if (invError) {
      console.error('Auto-invoice creation error:', invError)
    } else {
      invoice = newInvoice

      // Copy line items to invoice
      const lineItems = estimate.line_items || []
      if (lineItems.length > 0) {
        await supabase.from('invoice_line_items').insert(
          lineItems.map((item: any) => ({
            invoice_id: newInvoice.id,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_cost: item.unit_cost,
            total: item.total ?? item.quantity * item.unit_cost,
            is_taxable: item.is_taxable ?? true,
            order_index: item.order_index ?? 0,
          }))
        )
      }

      // Mark estimate as converted
      await supabase
        .from('estimates')
        .update({ status: 'converted' })
        .eq('id', estimateId)
    }
  } catch (e) {
    console.error('Auto-invoice error (non-critical):', e)
    // Estimate is still approved even if invoice creation fails
  }

  // ── Auto-create portal user if customer has email ─────────
  let portalUser = null
  let portalToken = null
  try {
    if (estimate.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('id, email, first_name, last_name')
        .eq('id', estimate.customer_id)
        .single()

      if (customer?.email) {
        // Check if portal user already exists
        const { data: existing } = await supabase
          .from('portal_users')
          .select('id')
          .eq('customer_id', customer.id)
          .eq('email', customer.email.toLowerCase())
          .limit(1)
          .single()

        if (!existing) {
          // Create portal user with magic link token
          const { randomBytes } = await import('crypto')
          const token = randomBytes(32).toString('hex')
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

          const { data: newPortalUser } = await supabase
            .from('portal_users')
            .insert({
              customer_id: customer.id,
              organization_id: estimate.organization_id,
              email: customer.email.toLowerCase(),
              magic_link_token: token,
              magic_link_expires_at: expiresAt,
            })
            .select()
            .single()

          if (newPortalUser) {
            portalUser = newPortalUser
            portalToken = token

            // Enable portal access on customer
            await supabase
              .from('customers')
              .update({ portal_access: true })
              .eq('id', customer.id)
          }
        } else {
          portalUser = existing
        }
      }
    }
  } catch (e) {
    console.error('Portal user creation error (non-critical):', e)
  }

  // Trigger workflow (non-blocking)
  try {
    const { trigger } = await import('@service-official/workflows')
    trigger('estimate.approved')(
      estimate.organization_id, 'estimate', estimateId,
      { estimate_number: estimate.estimate_number, total: estimate.total, invoice_id: invoice?.id }
    )
  } catch {}

  return NextResponse.json({
    data: { estimateId, status: invoice ? 'converted' : 'approved' },
    invoice: invoice ? { id: invoice.id, invoice_number: invoice.invoice_number } : null,
    portal: portalToken ? { token: portalToken, portal_user_id: portalUser?.id } : (portalUser ? { existing: true } : null),
    success: true,
  })
}
