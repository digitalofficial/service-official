import type { SupabaseClient } from '@supabase/supabase-js'
import type { ReportFilters, ReportRow } from './types'

type QueryFn = (supabase: SupabaseClient, orgId: string, filters: ReportFilters) => Promise<ReportRow[]>

// ─── Helpers ─────────────────────────────────────────────────

function dateFilter(query: any, field: string, filters: ReportFilters) {
  if (filters.date_from) query = query.gte(field, filters.date_from)
  if (filters.date_to) query = query.lte(field, filters.date_to)
  return query
}

function agingBucket(days: number): string {
  if (days <= 0) return 'Current'
  if (days <= 30) return '1-30 days'
  if (days <= 60) return '31-60 days'
  if (days <= 90) return '61-90 days'
  return '90+ days'
}

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24))
}

function customerName(c: any): string {
  if (!c) return 'Unknown'
  return c.company_name || `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Unknown'
}

// ─── Financial ───────────────────────────────────────────────

const profitAndLoss: QueryFn = async (supabase, orgId, filters) => {
  let invQuery = supabase.from('invoices').select('amount_paid, issue_date').eq('organization_id', orgId)
  invQuery = dateFilter(invQuery, 'issue_date', filters)
  const { data: invoices } = await invQuery

  let expQuery = supabase.from('expenses').select('total_amount, category, expense_date').eq('organization_id', orgId)
  expQuery = dateFilter(expQuery, 'expense_date', filters)
  const { data: expenses } = await expQuery

  const revenue = (invoices ?? []).reduce((s, i) => s + (i.amount_paid ?? 0), 0)
  const totalExp = (expenses ?? []).reduce((s, e) => s + (e.total_amount ?? 0), 0)

  // Group expenses by category
  const catMap: Record<string, number> = {}
  for (const e of expenses ?? []) {
    const cat = (e.category ?? 'other').replace(/_/g, ' ')
    catMap[cat] = (catMap[cat] ?? 0) + (e.total_amount ?? 0)
  }

  const rows: ReportRow[] = [
    { category: 'Revenue', revenue, expenses: 0, net: revenue },
  ]
  for (const [cat, amount] of Object.entries(catMap)) {
    rows.push({ category: cat, revenue: 0, expenses: amount, net: -amount })
  }
  rows.push({ category: 'Total', revenue, expenses: totalExp, net: revenue - totalExp })
  return rows
}

const revenueSummary: QueryFn = async (supabase, orgId, filters) => {
  let query = supabase.from('invoices').select('total, amount_paid, amount_due, issue_date, customer_id, customer:customers(company_name, first_name, last_name)').eq('organization_id', orgId)
  query = dateFilter(query, 'issue_date', filters)
  const { data: invoices } = await query

  if (filters.group_by === 'customer') {
    const map: Record<string, { invoiced: number; collected: number; outstanding: number }> = {}
    for (const inv of invoices ?? []) {
      const name = customerName(inv.customer)
      if (!map[name]) map[name] = { invoiced: 0, collected: 0, outstanding: 0 }
      map[name].invoiced += inv.total ?? 0
      map[name].collected += inv.amount_paid ?? 0
      map[name].outstanding += inv.amount_due ?? 0
    }
    return Object.entries(map).map(([period, v]) => ({ period, ...v }))
  }

  // Default: group by month
  const map: Record<string, { invoiced: number; collected: number; outstanding: number }> = {}
  for (const inv of invoices ?? []) {
    const month = (inv.issue_date ?? '').slice(0, 7) || 'Unknown'
    if (!map[month]) map[month] = { invoiced: 0, collected: 0, outstanding: 0 }
    map[month].invoiced += inv.total ?? 0
    map[month].collected += inv.amount_paid ?? 0
    map[month].outstanding += inv.amount_due ?? 0
  }
  return Object.entries(map).sort().map(([period, v]) => ({ period, ...v }))
}

const expenseReport: QueryFn = async (supabase, orgId, filters) => {
  let query = supabase.from('expenses').select('expense_date, category, vendor_name, description, total_amount').eq('organization_id', orgId).order('expense_date', { ascending: false })
  query = dateFilter(query, 'expense_date', filters)
  const { data } = await query

  return (data ?? []).map(e => ({
    date: e.expense_date,
    category: (e.category ?? 'other').replace(/_/g, ' '),
    vendor: e.vendor_name ?? '',
    description: e.description ?? '',
    amount: e.total_amount ?? 0,
  }))
}

const agingReceivables: QueryFn = async (supabase, orgId, filters) => {
  let query = supabase.from('invoices').select('invoice_number, issue_date, due_date, amount_due, status, customer:customers(company_name, first_name, last_name)').eq('organization_id', orgId).in('status', ['sent', 'viewed', 'partial', 'overdue'])
  if (filters.customer_id) query = query.eq('customer_id', filters.customer_id)
  const { data } = await query

  const today = new Date().toISOString().split('T')[0]
  return (data ?? []).map(inv => {
    const days = inv.due_date ? daysBetween(inv.due_date, today) : 0
    return {
      customer: customerName(inv.customer),
      invoice_number: inv.invoice_number ?? '',
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      amount_due: inv.amount_due ?? 0,
      age_days: Math.max(0, days),
      bucket: agingBucket(days),
    }
  })
}

const accountsPayable: QueryFn = async (supabase, orgId, filters) => {
  let query = supabase.from('purchase_orders').select('po_number, vendor:vendors(company_name), created_at, status, total').eq('organization_id', orgId).order('created_at', { ascending: false })
  query = dateFilter(query, 'created_at', filters)
  if (filters.status) query = query.eq('status', filters.status)
  const { data } = await query

  return (data ?? []).map(po => ({
    po_number: po.po_number ?? '',
    vendor: (po.vendor as any)?.company_name ?? '',
    date: po.created_at,
    status: po.status ?? '',
    total: po.total ?? 0,
  }))
}

const taxSummary: QueryFn = async (supabase, orgId, filters) => {
  let query = supabase.from('invoices').select('total, tax_amount, issue_date').eq('organization_id', orgId)
  query = dateFilter(query, 'issue_date', filters)
  const { data } = await query

  const map: Record<string, { taxable_revenue: number; tax_collected: number }> = {}
  for (const inv of data ?? []) {
    const month = (inv.issue_date ?? '').slice(0, 7) || 'Unknown'
    if (!map[month]) map[month] = { taxable_revenue: 0, tax_collected: 0 }
    map[month].taxable_revenue += inv.total ?? 0
    map[month].tax_collected += inv.tax_amount ?? 0
  }
  return Object.entries(map).sort().map(([period, v]) => ({
    period,
    ...v,
    tax_rate: v.taxable_revenue > 0 ? (v.tax_collected / v.taxable_revenue) * 100 : 0,
  }))
}

const paymentsReceived: QueryFn = async (supabase, orgId, filters) => {
  let query = supabase.from('payments').select('created_at, amount, method, status, invoice:invoices(invoice_number, customer:customers(company_name, first_name, last_name))').eq('organization_id', orgId).order('created_at', { ascending: false })
  query = dateFilter(query, 'created_at', filters)
  if (filters.customer_id) {
    query = query.eq('invoice.customer_id', filters.customer_id)
  }
  const { data } = await query

  return (data ?? []).map(p => ({
    date: p.created_at,
    customer: customerName((p.invoice as any)?.customer),
    invoice_number: (p.invoice as any)?.invoice_number ?? '',
    method: (p.method ?? '').replace(/_/g, ' '),
    amount: p.amount ?? 0,
    status: p.status ?? '',
  }))
}

// ─── Operations ──────────────────────────────────────────────

const jobProfitability: QueryFn = async (supabase, orgId, filters) => {
  let query = supabase.from('jobs').select('title, status, total_price, actual_cost, customer:customers(company_name, first_name, last_name)').eq('organization_id', orgId)
  query = dateFilter(query, 'created_at', filters)
  if (filters.status) query = query.eq('status', filters.status)
  const { data } = await query

  return (data ?? []).map(j => {
    const revenue = j.total_price ?? 0
    const cost = j.actual_cost ?? 0
    return {
      job_title: j.title ?? '',
      customer: customerName(j.customer),
      status: j.status ?? '',
      revenue,
      cost,
      profit: revenue - cost,
      margin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
    }
  })
}

const projectProfitability: QueryFn = async (supabase, orgId, filters) => {
  let query = supabase.from('projects').select('name, status, budget, actual_cost, total_invoiced, customer:customers(company_name, first_name, last_name)').eq('organization_id', orgId)
  query = dateFilter(query, 'created_at', filters)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.customer_id) query = query.eq('customer_id', filters.customer_id)
  const { data } = await query

  return (data ?? []).map(p => ({
    project_name: p.name ?? '',
    customer: customerName(p.customer),
    status: p.status ?? '',
    budget: p.budget ?? 0,
    actual_cost: p.actual_cost ?? 0,
    invoiced: p.total_invoiced ?? 0,
    variance: (p.budget ?? 0) - (p.actual_cost ?? 0),
  }))
}

const estimateConversion: QueryFn = async (supabase, orgId, filters) => {
  let query = supabase.from('estimates').select('estimate_number, total, status, issue_date, customer:customers(company_name, first_name, last_name)').eq('organization_id', orgId).order('issue_date', { ascending: false })
  query = dateFilter(query, 'issue_date', filters)
  if (filters.customer_id) query = query.eq('customer_id', filters.customer_id)
  const { data } = await query

  return (data ?? []).map(e => ({
    estimate_number: e.estimate_number ?? '',
    customer: customerName(e.customer),
    date: e.issue_date,
    total: e.total ?? 0,
    status: e.status ?? '',
    converted: e.status === 'converted' ? 'Yes' : 'No',
  }))
}

const invoiceStatus: QueryFn = async (supabase, orgId, filters) => {
  let query = supabase.from('invoices').select('invoice_number, issue_date, due_date, total, amount_paid, amount_due, status, customer:customers(company_name, first_name, last_name)').eq('organization_id', orgId).order('issue_date', { ascending: false })
  query = dateFilter(query, 'issue_date', filters)
  if (filters.customer_id) query = query.eq('customer_id', filters.customer_id)
  if (filters.status) query = query.eq('status', filters.status)
  const { data } = await query

  return (data ?? []).map(inv => ({
    invoice_number: inv.invoice_number ?? '',
    customer: customerName(inv.customer),
    issue_date: inv.issue_date,
    due_date: inv.due_date,
    total: inv.total ?? 0,
    amount_paid: inv.amount_paid ?? 0,
    amount_due: inv.amount_due ?? 0,
    status: inv.status ?? '',
  }))
}

const customerRevenue: QueryFn = async (supabase, orgId, filters) => {
  let invQuery = supabase.from('invoices').select('total, amount_paid, amount_due, customer_id, customer:customers(company_name, first_name, last_name)').eq('organization_id', orgId)
  invQuery = dateFilter(invQuery, 'issue_date', filters)
  const { data: invoices } = await invQuery

  let jobQuery = supabase.from('jobs').select('customer_id').eq('organization_id', orgId)
  jobQuery = dateFilter(jobQuery, 'created_at', filters)
  const { data: jobs } = await jobQuery

  const map: Record<string, { name: string; total_revenue: number; total_invoiced: number; outstanding: number; job_count: number }> = {}
  for (const inv of invoices ?? []) {
    const cid = inv.customer_id ?? 'unknown'
    if (!map[cid]) map[cid] = { name: customerName(inv.customer), total_revenue: 0, total_invoiced: 0, outstanding: 0, job_count: 0 }
    map[cid].total_revenue += inv.amount_paid ?? 0
    map[cid].total_invoiced += inv.total ?? 0
    map[cid].outstanding += inv.amount_due ?? 0
  }
  for (const j of jobs ?? []) {
    const cid = j.customer_id ?? 'unknown'
    if (map[cid]) map[cid].job_count++
  }

  return Object.values(map).map(v => ({
    customer: v.name,
    total_revenue: v.total_revenue,
    total_invoiced: v.total_invoiced,
    outstanding: v.outstanding,
    job_count: v.job_count,
  }))
}

// ─── Labor ───────────────────────────────────────────────────

const timeLabor: QueryFn = async (supabase, orgId, filters) => {
  let query = supabase.from('time_entries').select('date, hours, profile:profiles!profile_id(first_name, last_name, hourly_rate), job:jobs(title)').eq('organization_id', orgId).order('date', { ascending: false })
  query = dateFilter(query, 'date', filters)
  const { data } = await query

  return (data ?? []).map(te => {
    const rate = (te.profile as any)?.hourly_rate ?? 0
    return {
      team_member: `${(te.profile as any)?.first_name ?? ''} ${(te.profile as any)?.last_name ?? ''}`.trim(),
      date: te.date,
      job_title: (te.job as any)?.title ?? '',
      hours: te.hours ?? 0,
      rate,
      labor_cost: (te.hours ?? 0) * rate,
    }
  })
}

const equipmentUtilization: QueryFn = async (supabase, orgId, filters) => {
  let query = supabase.from('equipment_assignments').select('assigned_at, returned_at, status, equipment:equipment(name), profile:profiles!assigned_to(first_name, last_name), job:jobs(title)').eq('organization_id', orgId).order('assigned_at', { ascending: false })
  query = dateFilter(query, 'assigned_at', filters)
  const { data } = await query

  const today = new Date().toISOString().split('T')[0]
  return (data ?? []).map(ea => {
    const assignedDate = ea.assigned_at?.split('T')[0] ?? ''
    const returnedDate = ea.returned_at?.split('T')[0] ?? ''
    const endDate = returnedDate || today
    return {
      equipment_name: (ea.equipment as any)?.name ?? '',
      assigned_to: `${(ea.profile as any)?.first_name ?? ''} ${(ea.profile as any)?.last_name ?? ''}`.trim(),
      job_title: (ea.job as any)?.title ?? '',
      assigned_date: assignedDate,
      returned_date: returnedDate || null,
      days_out: assignedDate ? daysBetween(assignedDate, endDate) : 0,
      status: ea.status ?? '',
    }
  })
}

// ─── Registry ────────────────────────────────────────────────

export const queryRegistry: Record<string, QueryFn> = {
  'profit-and-loss': profitAndLoss,
  'revenue-summary': revenueSummary,
  'expense-report': expenseReport,
  'aging-receivables': agingReceivables,
  'accounts-payable': accountsPayable,
  'tax-summary': taxSummary,
  'payments-received': paymentsReceived,
  'job-profitability': jobProfitability,
  'project-profitability': projectProfitability,
  'estimate-conversion': estimateConversion,
  'invoice-status': invoiceStatus,
  'customer-revenue': customerRevenue,
  'time-labor': timeLabor,
  'equipment-utilization': equipmentUtilization,
}
