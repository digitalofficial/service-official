import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

const receiveSchema = z.object({
  items: z.array(z.object({
    po_line_item_id: z.string().uuid(),
    quantity_received: z.number().min(0),
    condition: z.enum(['good', 'damaged', 'wrong_item', 'short']).default('good'),
    notes: z.string().optional(),
  })),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

  const body = await request.json()
  const validated = receiveSchema.parse(body)

  // Create receipt
  const { data: receipt, error: receiptError } = await supabase
    .from('po_receipts')
    .insert({
      purchase_order_id: params.id,
      organization_id: profile.organization_id,
      received_by: user.id,
      notes: validated.notes,
    })
    .select()
    .single()

  if (receiptError) return NextResponse.json({ error: receiptError.message }, { status: 500 })

  // Create receipt items
  const receiptItems = validated.items
    .filter(i => i.quantity_received > 0)
    .map(i => ({
      receipt_id: receipt.id,
      po_line_item_id: i.po_line_item_id,
      quantity_received: i.quantity_received,
      condition: i.condition,
      notes: i.notes,
    }))

  if (receiptItems.length > 0) {
    await supabase.from('po_receipt_items').insert(receiptItems)
  }

  // Update po_line_items quantities
  for (const item of validated.items) {
    if (item.quantity_received > 0) {
      // Get current line item
      const { data: lineItem } = await supabase
        .from('po_line_items')
        .select('quantity_received, project_material_id')
        .eq('id', item.po_line_item_id)
        .single()

      if (lineItem) {
        const newQtyReceived = (lineItem.quantity_received || 0) + item.quantity_received
        await supabase
          .from('po_line_items')
          .update({ quantity_received: newQtyReceived, updated_at: new Date().toISOString() })
          .eq('id', item.po_line_item_id)

        // Sync project_materials if linked
        if (lineItem.project_material_id) {
          const { data: mat } = await supabase
            .from('project_materials')
            .select('quantity_received, quantity_ordered')
            .eq('id', lineItem.project_material_id)
            .single()

          if (mat) {
            const matQtyReceived = (mat.quantity_received || 0) + item.quantity_received
            const matStatus = matQtyReceived >= (mat.quantity_ordered || 0) ? 'received' : 'partial'
            await supabase
              .from('project_materials')
              .update({ quantity_received: matQtyReceived, status: matStatus })
              .eq('id', lineItem.project_material_id)
          }
        }
      }
    }
  }

  // Check if PO is fully received
  const { data: allLineItems } = await supabase
    .from('po_line_items')
    .select('quantity, quantity_received')
    .eq('purchase_order_id', params.id)

  const allReceived = allLineItems?.every(li => (li.quantity_received || 0) >= li.quantity)
  const someReceived = allLineItems?.some(li => (li.quantity_received || 0) > 0)

  const newStatus = allReceived ? 'fulfilled' : someReceived ? 'partial' : undefined
  if (newStatus) {
    await supabase
      .from('purchase_orders')
      .update({ status: newStatus, delivered_at: allReceived ? new Date().toISOString() : undefined, updated_at: new Date().toISOString() })
      .eq('id', params.id)
  }

  return NextResponse.json({ data: receipt, success: true, po_status: newStatus }, { status: 201 })
}
