import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { resolveTimezone } from '@/lib/utils'

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCSV(columns: { key: string; label: string }[], rows: Record<string, unknown>[]): string {
  const header = columns.map(c => csvEscape(c.label)).join(',')
  const body = rows.map(row =>
    columns.map(col => csvEscape(row[col.key])).join(',')
  )
  return [header, ...body].join('\n')
}

let _exportTz = 'America/Denver'
function flatDate(val: unknown): string {
  if (!val) return ''
  const d = new Date(String(val))
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-US', { timeZone: _exportTz })
}

function customerName(c: any): string {
  if (!c) return ''
  return c.company_name || `${c.first_name || ''} ${c.last_name || ''}`.trim()
}

export async function GET(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  // Check export permission from org settings
  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', profile.organization_id)
    .single()

  const exportRoles: string[] = (org?.settings as any)?.export_allowed_roles ?? ['owner', 'admin']
  if (!exportRoles.includes(profile.role)) {
    return NextResponse.json({ error: 'You do not have permission to export data' }, { status: 403 })
  }

  _exportTz = resolveTimezone((profile.organization as any)?.timezone)
  const orgId = profile.organization_id
  const entity = request.nextUrl.searchParams.get('entity')

  let csv = ''
  let filename = 'export'

  switch (entity) {
    case 'customers': {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      csv = toCSV([
        { key: 'type', label: 'Type' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'company_name', label: 'Company' },
        { key: 'email', label: 'Email' },
        { key: 'email_secondary', label: 'Email (Secondary)' },
        { key: 'phone', label: 'Phone' },
        { key: 'phone_secondary', label: 'Phone (Secondary)' },
        { key: 'address_line1', label: 'Address' },
        { key: 'address_line2', label: 'Address Line 2' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'zip', label: 'Zip' },
        { key: 'source', label: 'Source' },
        { key: 'tags', label: 'Tags' },
        { key: 'total_revenue', label: 'Total Revenue' },
        { key: 'outstanding_balance', label: 'Outstanding Balance' },
        { key: 'notes', label: 'Notes' },
        { key: 'created_at_fmt', label: 'Created' },
      ], (data ?? []).map((r: any) => ({
        ...r,
        tags: r.tags?.join('; ') ?? '',
        created_at_fmt: flatDate(r.created_at),
      })))
      filename = 'customers'
      break
    }

    case 'projects': {
      const { data } = await supabase
        .from('projects')
        .select(`
          *,
          customer:customers(first_name, last_name, company_name),
          manager:profiles!project_manager_id(first_name, last_name),
          foreman:profiles!foreman_id(first_name, last_name)
        `)
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      csv = toCSV([
        { key: 'project_number', label: 'Project #' },
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'industry', label: 'Industry' },
        { key: 'type', label: 'Type' },
        { key: 'address_line1', label: 'Address' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'zip', label: 'Zip' },
        { key: 'contract_value', label: 'Contract Value' },
        { key: 'estimated_cost', label: 'Estimated Cost' },
        { key: 'actual_cost', label: 'Actual Cost' },
        { key: 'profit_margin', label: 'Profit Margin %' },
        { key: 'estimated_start', label: 'Est. Start' },
        { key: 'estimated_end', label: 'Est. End' },
        { key: 'actual_start', label: 'Actual Start' },
        { key: 'actual_end', label: 'Actual End' },
        { key: 'manager_name', label: 'Project Manager' },
        { key: 'foreman_name', label: 'Foreman' },
        { key: 'permit_number', label: 'Permit #' },
        { key: 'tags', label: 'Tags' },
        { key: 'internal_notes', label: 'Notes' },
        { key: 'created_at_fmt', label: 'Created' },
      ], (data ?? []).map((r: any) => ({
        ...r,
        customer_name: customerName(r.customer),
        manager_name: r.manager ? `${r.manager.first_name} ${r.manager.last_name}` : '',
        foreman_name: r.foreman ? `${r.foreman.first_name} ${r.foreman.last_name}` : '',
        estimated_start: flatDate(r.estimated_start_date),
        estimated_end: flatDate(r.estimated_end_date),
        actual_start: flatDate(r.actual_start_date),
        actual_end: flatDate(r.actual_end_date),
        tags: r.tags?.join('; ') ?? '',
        created_at_fmt: flatDate(r.created_at),
      })))
      filename = 'projects'
      break
    }

    case 'jobs': {
      const { data } = await supabase
        .from('jobs')
        .select(`
          *,
          customer:customers(first_name, last_name, company_name),
          assignee:profiles!assigned_to(first_name, last_name),
          project:projects(name)
        `)
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      csv = toCSV([
        { key: 'job_number', label: 'Job #' },
        { key: 'title', label: 'Title' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' },
        { key: 'type', label: 'Type' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'project_name', label: 'Project' },
        { key: 'assignee_name', label: 'Assigned To' },
        { key: 'address_line1', label: 'Address' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'zip', label: 'Zip' },
        { key: 'scheduled_start_fmt', label: 'Scheduled Start' },
        { key: 'scheduled_end_fmt', label: 'Scheduled End' },
        { key: 'actual_start_fmt', label: 'Actual Start' },
        { key: 'actual_end_fmt', label: 'Actual End' },
        { key: 'duration_minutes', label: 'Duration (min)' },
        { key: 'description', label: 'Description' },
        { key: 'instructions', label: 'Instructions' },
        { key: 'completion_notes', label: 'Completion Notes' },
        { key: 'tags', label: 'Tags' },
        { key: 'created_at_fmt', label: 'Created' },
      ], (data ?? []).map((r: any) => ({
        ...r,
        customer_name: customerName(r.customer),
        project_name: r.project?.name ?? '',
        assignee_name: r.assignee ? `${r.assignee.first_name} ${r.assignee.last_name}` : '',
        scheduled_start_fmt: flatDate(r.scheduled_start),
        scheduled_end_fmt: flatDate(r.scheduled_end),
        actual_start_fmt: flatDate(r.actual_start),
        actual_end_fmt: flatDate(r.actual_end),
        tags: r.tags?.join('; ') ?? '',
        created_at_fmt: flatDate(r.created_at),
      })))
      filename = 'jobs'
      break
    }

    case 'invoices': {
      const { data } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(first_name, last_name, company_name),
          project:projects(name),
          line_items:invoice_line_items(name, description, quantity, unit, unit_cost, total, is_taxable)
        `)
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // Flatten: one row per line item, with invoice details repeated
      const rows: Record<string, unknown>[] = []
      for (const inv of data ?? []) {
        const items = (inv as any).line_items ?? []
        if (items.length === 0) {
          rows.push({
            invoice_number: inv.invoice_number,
            title: inv.title,
            status: inv.status,
            type: inv.type,
            customer_name: customerName((inv as any).customer),
            project_name: (inv as any).project?.name ?? '',
            issue_date: flatDate(inv.issue_date),
            due_date: flatDate(inv.due_date),
            subtotal: inv.subtotal,
            discount_amount: inv.discount_amount,
            tax_amount: inv.tax_amount,
            total: inv.total,
            amount_paid: inv.amount_paid,
            amount_due: inv.amount_due,
            paid_at: flatDate(inv.paid_at),
            terms: inv.terms,
            notes: inv.notes,
            line_item_name: '',
            line_item_desc: '',
            line_item_qty: '',
            line_item_unit: '',
            line_item_unit_cost: '',
            line_item_total: '',
            line_item_taxable: '',
          })
        } else {
          for (const li of items) {
            rows.push({
              invoice_number: inv.invoice_number,
              title: inv.title,
              status: inv.status,
              type: inv.type,
              customer_name: customerName((inv as any).customer),
              project_name: (inv as any).project?.name ?? '',
              issue_date: flatDate(inv.issue_date),
              due_date: flatDate(inv.due_date),
              subtotal: inv.subtotal,
              discount_amount: inv.discount_amount,
              tax_amount: inv.tax_amount,
              total: inv.total,
              amount_paid: inv.amount_paid,
              amount_due: inv.amount_due,
              paid_at: flatDate(inv.paid_at),
              terms: inv.terms,
              notes: inv.notes,
              line_item_name: li.name,
              line_item_desc: li.description,
              line_item_qty: li.quantity,
              line_item_unit: li.unit,
              line_item_unit_cost: li.unit_cost,
              line_item_total: li.total,
              line_item_taxable: li.is_taxable ? 'Yes' : 'No',
            })
          }
        }
      }

      csv = toCSV([
        { key: 'invoice_number', label: 'Invoice #' },
        { key: 'title', label: 'Title' },
        { key: 'status', label: 'Status' },
        { key: 'type', label: 'Type' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'project_name', label: 'Project' },
        { key: 'issue_date', label: 'Issue Date' },
        { key: 'due_date', label: 'Due Date' },
        { key: 'subtotal', label: 'Subtotal' },
        { key: 'discount_amount', label: 'Discount' },
        { key: 'tax_amount', label: 'Tax' },
        { key: 'total', label: 'Total' },
        { key: 'amount_paid', label: 'Amount Paid' },
        { key: 'amount_due', label: 'Amount Due' },
        { key: 'paid_at', label: 'Paid Date' },
        { key: 'terms', label: 'Terms' },
        { key: 'notes', label: 'Notes' },
        { key: 'line_item_name', label: 'Line Item' },
        { key: 'line_item_desc', label: 'Line Item Description' },
        { key: 'line_item_qty', label: 'Qty' },
        { key: 'line_item_unit', label: 'Unit' },
        { key: 'line_item_unit_cost', label: 'Unit Cost' },
        { key: 'line_item_total', label: 'Line Total' },
        { key: 'line_item_taxable', label: 'Taxable' },
      ], rows)
      filename = 'invoices'
      break
    }

    case 'estimates': {
      const { data } = await supabase
        .from('estimates')
        .select(`
          *,
          customer:customers(first_name, last_name, company_name),
          project:projects(name),
          sections:estimate_sections(name, order_index),
          line_items:estimate_line_items(name, description, category, quantity, unit, unit_cost, markup_percent, total, is_optional, is_taxable, section_id)
        `)
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      const rows: Record<string, unknown>[] = []
      for (const est of data ?? []) {
        const items = (est as any).line_items ?? []
        const sections = (est as any).sections ?? []
        const sectionMap: Record<string, string> = {}
        for (const s of sections) sectionMap[s.id] = s.name

        if (items.length === 0) {
          rows.push({
            estimate_number: est.estimate_number,
            title: est.title,
            status: est.status,
            customer_name: customerName((est as any).customer),
            project_name: (est as any).project?.name ?? '',
            issue_date: flatDate(est.issue_date),
            expiry_date: flatDate(est.expiry_date),
            subtotal: est.subtotal,
            discount_amount: est.discount_amount,
            tax_rate: est.tax_rate,
            tax_amount: est.tax_amount,
            total: est.total,
            approved_at: flatDate(est.approved_at),
            terms: est.terms,
            notes: est.notes,
            section_name: '',
            line_item_name: '',
            line_item_desc: '',
            line_item_category: '',
            line_item_qty: '',
            line_item_unit: '',
            line_item_unit_cost: '',
            line_item_markup: '',
            line_item_total: '',
            line_item_optional: '',
            line_item_taxable: '',
          })
        } else {
          for (const li of items) {
            rows.push({
              estimate_number: est.estimate_number,
              title: est.title,
              status: est.status,
              customer_name: customerName((est as any).customer),
              project_name: (est as any).project?.name ?? '',
              issue_date: flatDate(est.issue_date),
              expiry_date: flatDate(est.expiry_date),
              subtotal: est.subtotal,
              discount_amount: est.discount_amount,
              tax_rate: est.tax_rate,
              tax_amount: est.tax_amount,
              total: est.total,
              approved_at: flatDate(est.approved_at),
              terms: est.terms,
              notes: est.notes,
              section_name: sectionMap[li.section_id] ?? '',
              line_item_name: li.name,
              line_item_desc: li.description,
              line_item_category: li.category,
              line_item_qty: li.quantity,
              line_item_unit: li.unit,
              line_item_unit_cost: li.unit_cost,
              line_item_markup: li.markup_percent,
              line_item_total: li.total,
              line_item_optional: li.is_optional ? 'Yes' : 'No',
              line_item_taxable: li.is_taxable ? 'Yes' : 'No',
            })
          }
        }
      }

      csv = toCSV([
        { key: 'estimate_number', label: 'Estimate #' },
        { key: 'title', label: 'Title' },
        { key: 'status', label: 'Status' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'project_name', label: 'Project' },
        { key: 'issue_date', label: 'Issue Date' },
        { key: 'expiry_date', label: 'Expiry Date' },
        { key: 'subtotal', label: 'Subtotal' },
        { key: 'discount_amount', label: 'Discount' },
        { key: 'tax_rate', label: 'Tax Rate %' },
        { key: 'tax_amount', label: 'Tax' },
        { key: 'total', label: 'Total' },
        { key: 'approved_at', label: 'Approved Date' },
        { key: 'terms', label: 'Terms' },
        { key: 'notes', label: 'Notes' },
        { key: 'section_name', label: 'Section' },
        { key: 'line_item_name', label: 'Line Item' },
        { key: 'line_item_desc', label: 'Line Item Description' },
        { key: 'line_item_category', label: 'Category' },
        { key: 'line_item_qty', label: 'Qty' },
        { key: 'line_item_unit', label: 'Unit' },
        { key: 'line_item_unit_cost', label: 'Unit Cost' },
        { key: 'line_item_markup', label: 'Markup %' },
        { key: 'line_item_total', label: 'Line Total' },
        { key: 'line_item_optional', label: 'Optional' },
        { key: 'line_item_taxable', label: 'Taxable' },
      ], rows)
      filename = 'estimates'
      break
    }

    case 'payments': {
      const { data } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices(invoice_number),
          customer:customers(first_name, last_name, company_name)
        `)
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      csv = toCSV([
        { key: 'date', label: 'Date' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'invoice_number', label: 'Invoice #' },
        { key: 'amount', label: 'Amount' },
        { key: 'currency', label: 'Currency' },
        { key: 'method', label: 'Method' },
        { key: 'status', label: 'Status' },
        { key: 'reference', label: 'Reference' },
        { key: 'notes', label: 'Notes' },
        { key: 'refunded_amount', label: 'Refunded Amount' },
        { key: 'refunded_at_fmt', label: 'Refunded Date' },
      ], (data ?? []).map((r: any) => ({
        ...r,
        date: flatDate(r.created_at),
        customer_name: customerName(r.customer),
        invoice_number: r.invoice?.invoice_number ?? '',
        refunded_at_fmt: flatDate(r.refunded_at),
      })))
      filename = 'payments'
      break
    }

    case 'expenses': {
      const { data } = await supabase
        .from('expenses')
        .select(`
          *,
          project:projects(name),
          job:jobs(title, job_number),
          submitter:profiles!submitted_by(first_name, last_name),
          approver:profiles!approved_by(first_name, last_name)
        `)
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .order('expense_date', { ascending: false })

      csv = toCSV([
        { key: 'expense_date_fmt', label: 'Date' },
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'category', label: 'Category' },
        { key: 'amount', label: 'Amount' },
        { key: 'tax_amount', label: 'Tax' },
        { key: 'total_amount', label: 'Total' },
        { key: 'vendor_name', label: 'Vendor' },
        { key: 'vendor_invoice_number', label: 'Vendor Invoice #' },
        { key: 'project_name', label: 'Project' },
        { key: 'job_ref', label: 'Job' },
        { key: 'status', label: 'Status' },
        { key: 'is_billable', label: 'Billable' },
        { key: 'is_reimbursable', label: 'Reimbursable' },
        { key: 'submitter_name', label: 'Submitted By' },
        { key: 'approver_name', label: 'Approved By' },
        { key: 'approved_at_fmt', label: 'Approved Date' },
      ], (data ?? []).map((r: any) => ({
        ...r,
        expense_date_fmt: flatDate(r.expense_date),
        project_name: r.project?.name ?? '',
        job_ref: r.job ? `${r.job.job_number} - ${r.job.title}` : '',
        is_billable: r.is_billable ? 'Yes' : 'No',
        is_reimbursable: r.is_reimbursable ? 'Yes' : 'No',
        submitter_name: r.submitter ? `${r.submitter.first_name} ${r.submitter.last_name}` : '',
        approver_name: r.approver ? `${r.approver.first_name} ${r.approver.last_name}` : '',
        approved_at_fmt: flatDate(r.approved_at),
      })))
      filename = 'expenses'
      break
    }

    case 'purchase-orders': {
      const { data } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          vendor:vendors(name),
          project:projects(name),
          line_items:po_line_items(name, description, sku, quantity, quantity_received, unit, unit_cost, total)
        `)
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      const rows: Record<string, unknown>[] = []
      for (const po of data ?? []) {
        const items = (po as any).line_items ?? []
        if (items.length === 0) {
          rows.push({
            po_number: po.po_number,
            title: po.title,
            status: po.status,
            vendor_name: (po as any).vendor?.name ?? '',
            project_name: (po as any).project?.name ?? '',
            issue_date: flatDate(po.issue_date),
            expected_delivery: flatDate(po.expected_delivery),
            subtotal: po.subtotal,
            tax_rate: po.tax_rate,
            tax_amount: po.tax_amount,
            shipping_cost: po.shipping_cost,
            total: po.total,
            payment_terms: po.payment_terms,
            notes: po.notes,
            li_name: '', li_desc: '', li_sku: '', li_qty: '', li_received: '', li_unit: '', li_cost: '', li_total: '',
          })
        } else {
          for (const li of items) {
            rows.push({
              po_number: po.po_number,
              title: po.title,
              status: po.status,
              vendor_name: (po as any).vendor?.name ?? '',
              project_name: (po as any).project?.name ?? '',
              issue_date: flatDate(po.issue_date),
              expected_delivery: flatDate(po.expected_delivery),
              subtotal: po.subtotal,
              tax_rate: po.tax_rate,
              tax_amount: po.tax_amount,
              shipping_cost: po.shipping_cost,
              total: po.total,
              payment_terms: po.payment_terms,
              notes: po.notes,
              li_name: li.name,
              li_desc: li.description,
              li_sku: li.sku,
              li_qty: li.quantity,
              li_received: li.quantity_received,
              li_unit: li.unit,
              li_cost: li.unit_cost,
              li_total: li.total,
            })
          }
        }
      }

      csv = toCSV([
        { key: 'po_number', label: 'PO #' },
        { key: 'title', label: 'Title' },
        { key: 'status', label: 'Status' },
        { key: 'vendor_name', label: 'Vendor' },
        { key: 'project_name', label: 'Project' },
        { key: 'issue_date', label: 'Issue Date' },
        { key: 'expected_delivery', label: 'Expected Delivery' },
        { key: 'subtotal', label: 'Subtotal' },
        { key: 'tax_rate', label: 'Tax Rate %' },
        { key: 'tax_amount', label: 'Tax' },
        { key: 'shipping_cost', label: 'Shipping' },
        { key: 'total', label: 'Total' },
        { key: 'payment_terms', label: 'Payment Terms' },
        { key: 'notes', label: 'Notes' },
        { key: 'li_name', label: 'Line Item' },
        { key: 'li_desc', label: 'Line Item Description' },
        { key: 'li_sku', label: 'SKU' },
        { key: 'li_qty', label: 'Qty Ordered' },
        { key: 'li_received', label: 'Qty Received' },
        { key: 'li_unit', label: 'Unit' },
        { key: 'li_cost', label: 'Unit Cost' },
        { key: 'li_total', label: 'Line Total' },
      ], rows)
      filename = 'purchase-orders'
      break
    }

    case 'time-entries': {
      const { data } = await supabase
        .from('time_entries')
        .select(`
          *,
          profile:profiles!profile_id(first_name, last_name),
          job:jobs(title, job_number)
        `)
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .order('date', { ascending: false })

      csv = toCSV([
        { key: 'date_fmt', label: 'Date' },
        { key: 'worker', label: 'Worker' },
        { key: 'job_ref', label: 'Job' },
        { key: 'hours', label: 'Hours' },
        { key: 'break_minutes', label: 'Break (min)' },
        { key: 'hourly_rate', label: 'Hourly Rate' },
        { key: 'total_pay', label: 'Total Pay' },
        { key: 'description', label: 'Description' },
      ], (data ?? []).map((r: any) => ({
        ...r,
        date_fmt: flatDate(r.date),
        worker: r.profile ? `${r.profile.first_name} ${r.profile.last_name}` : '',
        job_ref: r.job ? `${r.job.job_number} - ${r.job.title}` : '',
      })))
      filename = 'time-entries'
      break
    }

    default:
      return NextResponse.json({ error: 'Invalid entity' }, { status: 400 })
  }

  const date = new Date().toISOString().split('T')[0]
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}-${date}.csv"`,
    },
  })
}
