import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'No profile found' }, { status: 400 })

  // Only owner/admin/office_manager can import
  if (!['owner', 'admin', 'office_manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json()
  const { type, rows } = body

  if (!type || !rows?.length) {
    return NextResponse.json({ error: 'Missing type or rows' }, { status: 400 })
  }

  const orgId = profile.organization_id
  let imported = 0
  let skipped = 0
  const errors: string[] = []

  if (type === 'customers') {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const firstName = (row.first_name || row.firstName || row['First Name'] || '').trim()
      const lastName = (row.last_name || row.lastName || row['Last Name'] || '').trim()
      const companyName = (row.company_name || row.companyName || row['Company Name'] || row.company || row.Company || '').trim()
      const email = (row.email || row.Email || row['Email Address'] || '').trim().toLowerCase()
      const phone = (row.phone || row.Phone || row['Phone Number'] || row.mobile || row.Mobile || '').trim()
      const address = (row.address || row.Address || row['Street Address'] || row.street || '').trim()
      const city = (row.city || row.City || '').trim()
      const state = (row.state || row.State || '').trim()
      const zip = (row.zip || row.Zip || row.zip_code || row['Zip Code'] || row.postal_code || '').trim()
      const notes = (row.notes || row.Notes || '').trim()
      const customerType = (row.type || row.Type || row['Customer Type'] || 'residential').trim().toLowerCase()

      if (!firstName && !lastName && !companyName) {
        skipped++
        continue
      }

      const { error } = await supabase.from('customers').insert({
        organization_id: orgId,
        first_name: firstName || null,
        last_name: lastName || null,
        company_name: companyName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        notes: notes || null,
        type: ['residential', 'commercial', 'property_manager', 'hoa', 'government'].includes(customerType) ? customerType : 'residential',
      })

      if (error) {
        errors.push(`Row ${i + 1}: ${error.message}`)
        skipped++
      } else {
        imported++
      }
    }
  } else if (type === 'invoices') {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const invoiceNumber = (row.invoice_number || row['Invoice Number'] || row.number || row.Number || '').trim()
      const title = (row.title || row.Title || row.description || row.Description || row.memo || row.Memo || '').trim()
      const customerName = (row.customer || row.Customer || row['Customer Name'] || row.client || row.Client || '').trim()
      const issueDate = (row.issue_date || row['Issue Date'] || row.date || row.Date || row['Invoice Date'] || '').trim()
      const dueDate = (row.due_date || row['Due Date'] || '').trim()
      const total = parseFloat(row.total || row.Total || row.amount || row.Amount || '0') || 0
      const amountPaid = parseFloat(row.amount_paid || row['Amount Paid'] || row.paid || row.Paid || '0') || 0
      const status = (row.status || row.Status || 'draft').trim().toLowerCase()
      const notes = (row.notes || row.Notes || '').trim()
      const terms = (row.terms || row.Terms || '').trim()

      // Line item fields (single line item per row for flat CSV)
      const itemName = (row.item_name || row['Item Name'] || row['Line Item'] || row.item || '').trim()
      const itemQty = parseFloat(row.quantity || row.Quantity || row.qty || row.Qty || '1') || 1
      const itemPrice = parseFloat(row.unit_price || row['Unit Price'] || row.price || row.Price || row.rate || row.Rate || '0') || 0

      if (!total && !itemName) {
        skipped++
        continue
      }

      // Try to find customer by name
      let customerId: string | null = null
      if (customerName) {
        const nameParts = customerName.split(' ')
        const { data: matches } = await supabase
          .from('customers')
          .select('id')
          .eq('organization_id', orgId)
          .or(`first_name.ilike.%${nameParts[0]}%,company_name.ilike.%${customerName}%`)
          .limit(1)
        if (matches?.length) customerId = matches[0].id
      }

      // Generate invoice number if missing
      let finalInvoiceNumber = invoiceNumber
      if (!finalInvoiceNumber) {
        const { count } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
        const year = new Date().getFullYear()
        finalInvoiceNumber = `INV-${year}-${String((count ?? 0) + 1 + i).padStart(4, '0')}`
      }

      const validStatuses = ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'voided', 'refunded']
      const invoiceStatus = validStatuses.includes(status) ? status : 'draft'

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          organization_id: orgId,
          invoice_number: finalInvoiceNumber,
          title: title || null,
          customer_id: customerId,
          status: invoiceStatus,
          type: 'standard',
          issue_date: issueDate || new Date().toISOString().split('T')[0],
          due_date: dueDate || null,
          subtotal: total,
          discount_amount: 0,
          tax_amount: 0,
          total,
          amount_paid: amountPaid,
          amount_due: total - amountPaid,
          terms: terms || null,
          notes: notes || null,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        errors.push(`Row ${i + 1}: ${error.message}`)
        skipped++
        continue
      }

      imported++

      // Insert line item if present
      if (itemName && invoice) {
        await supabase.from('invoice_line_items').insert({
          invoice_id: invoice.id,
          name: itemName,
          quantity: itemQty,
          unit_cost: itemPrice,
          total: itemQty * itemPrice,
          is_taxable: true,
          order_index: 0,
        })
      }
    }
  } else {
    return NextResponse.json({ error: 'Invalid import type' }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    imported,
    skipped,
    errors: errors.slice(0, 10),
    total: rows.length,
  })
}
