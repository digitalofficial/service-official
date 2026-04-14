import { createServiceRoleClient } from '../../client-server'
import type { Project, PaginatedResponse } from '@service-official/types'

export interface GetProjectsOptions {
  organization_id: string
  status?: string
  customer_id?: string
  project_manager_id?: string
  search?: string
  page?: number
  per_page?: number
  id_in?: string[]
}

export async function getProjects(options: GetProjectsOptions): Promise<PaginatedResponse<Project>> {
  const supabase = createServiceRoleClient()
  const { organization_id, status, customer_id, search, page = 1, per_page = 20, id_in } = options

  let query = supabase
    .from('projects')
    .select(`
      *,
      customer:customers(id, first_name, last_name, company_name, phone, email),
      project_manager:profiles!project_manager_id(id, first_name, last_name, avatar_url),
      foreman:profiles!foreman_id(id, first_name, last_name, avatar_url),
      phases:project_phases(*),
      gantt_tasks(id, progress)
    `, { count: 'exact' })
    .eq('organization_id', organization_id)
    .order('created_at', { ascending: false })
    .range((page - 1) * per_page, page * per_page - 1)

  if (status) query = query.eq('status', status)
  if (customer_id) query = query.eq('customer_id', customer_id)
  if (search) query = query.ilike('name', `%${search}%`)
  if (id_in) query = query.in('id', id_in)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: data as Project[],
    total: count ?? 0,
    page,
    per_page,
    total_pages: Math.ceil((count ?? 0) / per_page),
  }
}

export async function getProjectById(id: string, organization_id?: string): Promise<Project | null> {
  const supabase = createServiceRoleClient()

  let query = supabase
    .from('projects')
    .select(`
      *,
      customer:customers(*),
      project_manager:profiles!project_manager_id(*),
      foreman:profiles!foreman_id(*),
      phases:project_phases(*),
      milestones:project_milestones(*),
      team:project_team(*, profile:profiles(*))
    `)
    .eq('id', id)

  if (organization_id) query = query.eq('organization_id', organization_id)

  const { data, error } = await query.single()

  if (error) return null
  return data as Project
}

export async function createProject(data: Partial<Project>): Promise<Project> {
  const supabase = createServiceRoleClient()

  // Auto-generate project number
  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', data.organization_id!)

  const project_number = `PRJ-${String((count ?? 0) + 1).padStart(4, '0')}`

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ ...data, project_number })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return project as Project
}

export async function updateProject(id: string, updates: Partial<Project>, organization_id?: string): Promise<Project> {
  const supabase = createServiceRoleClient()

  let query = supabase
    .from('projects')
    .update(updates)
    .eq('id', id)

  if (organization_id) query = query.eq('organization_id', organization_id)

  const { data, error } = await query.select().single()

  if (error) throw new Error(error.message)
  return data as Project
}

export async function deleteProject(id: string, organization_id?: string): Promise<void> {
  const supabase = createServiceRoleClient()

  let query = supabase.from('projects').delete().eq('id', id)
  if (organization_id) query = query.eq('organization_id', organization_id)

  const { error } = await query
  if (error) throw new Error(error.message)
}

export async function getProjectStats(project_id: string) {
  const supabase = createServiceRoleClient()

  const [expenses, materials, photos, files, punch_list, rfis, change_orders, time_entries, submittals, daily_logs, inspections, gantt_tasks, purchase_orders] = await Promise.all([
    supabase.from('expenses').select('total_amount, status').eq('project_id', project_id),
    supabase.from('project_materials').select('total_cost, unit_cost, quantity_estimated, status').eq('project_id', project_id),
    supabase.from('photos').select('id', { count: 'exact', head: true }).eq('project_id', project_id).is('deleted_at', null),
    supabase.from('files').select('id', { count: 'exact', head: true }).eq('project_id', project_id),
    supabase.from('punch_list_items').select('status').eq('project_id', project_id),
    supabase.from('rfis').select('status').eq('project_id', project_id),
    supabase.from('change_orders').select('amount, approved_amount, status').eq('project_id', project_id),
    supabase.from('time_entries').select('hours, jobs!inner(project_id)').eq('jobs.project_id', project_id),
    supabase.from('submittals').select('status').eq('project_id', project_id),
    supabase.from('daily_logs').select('id', { count: 'exact', head: true }).eq('project_id', project_id),
    supabase.from('inspections').select('status').eq('project_id', project_id).is('deleted_at', null),
    supabase.from('gantt_tasks').select('progress, name').eq('project_id', project_id).is('deleted_at', null),
    supabase.from('purchase_orders').select('total, status').eq('project_id', project_id),
  ])

  const total_expenses = expenses.data?.reduce((sum, e) => sum + (e.total_amount || 0), 0) ?? 0
  const total_materials = materials.data?.reduce((sum, m) => {
    const cost = m.total_cost || ((m.unit_cost || 0) * (m.quantity_estimated || 0))
    return sum + cost
  }, 0) ?? 0
  const total_labor_hours = time_entries.data?.reduce((sum: number, t: any) => sum + (t.hours || 0), 0) ?? 0
  const total_labor_cost = total_labor_hours * 45 // Default hourly rate
  const actual_cost = total_expenses + total_materials + total_labor_cost

  // Counts
  const open_punch_items = punch_list.data?.filter(p => p.status === 'open' || p.status === 'in_progress').length ?? 0
  const total_punch_items = punch_list.data?.length ?? 0
  const completed_punch_items = punch_list.data?.filter(p => p.status === 'completed').length ?? 0
  const open_rfis = rfis.data?.filter(r => r.status !== 'closed' && r.status !== 'answered').length ?? 0
  const total_rfis = rfis.data?.length ?? 0
  const approved_change_orders = change_orders.data
    ?.filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + (c.approved_amount ?? c.amount ?? 0), 0) ?? 0
  const total_change_orders = change_orders.data?.length ?? 0
  const pending_change_orders = change_orders.data?.filter(c => c.status === 'draft' || c.status === 'submitted').length ?? 0
  const pending_submittals = submittals.data?.filter(s => s.status !== 'approved' && s.status !== 'rejected').length ?? 0
  const total_submittals = submittals.data?.length ?? 0
  const pending_expenses = expenses.data?.filter(e => e.status === 'pending').length ?? 0
  const total_expenses_count = expenses.data?.length ?? 0
  const materials_pending = materials.data?.filter(m => m.status === 'pending' || m.status === 'ordered').length ?? 0
  const total_materials_count = materials.data?.length ?? 0
  const pending_inspections = inspections.data?.filter(i => i.status === 'scheduled' || i.status === 'in_progress').length ?? 0
  const total_inspections = inspections.data?.length ?? 0

  return {
    total_expenses,
    total_materials,
    total_labor_hours,
    total_labor_cost,
    actual_cost,
    photo_count: photos.count ?? 0,
    file_count: files.count ?? 0,
    daily_log_count: daily_logs.count ?? 0,
    // Punch list
    open_punch_items,
    total_punch_items,
    completed_punch_items,
    // RFIs
    open_rfis,
    total_rfis,
    // Change orders
    approved_change_orders,
    total_change_orders,
    pending_change_orders,
    // Submittals
    pending_submittals,
    total_submittals,
    // Expenses
    pending_expenses,
    total_expenses_count,
    // Materials
    materials_pending,
    total_materials_count,
    // Inspections
    pending_inspections,
    total_inspections,
    // Schedule
    schedule_tasks: gantt_tasks.data ?? [],
    schedule_progress: gantt_tasks.data && gantt_tasks.data.length > 0
      ? Math.round(gantt_tasks.data.reduce((sum, t) => sum + (t.progress || 0), 0) / gantt_tasks.data.length)
      : 0,
    total_schedule_tasks: gantt_tasks.data?.length ?? 0,
    // Purchase Orders
    total_po_value: purchase_orders.data?.reduce((sum, po) => sum + (po.total || 0), 0) ?? 0,
    total_pos: purchase_orders.data?.length ?? 0,
    open_pos: purchase_orders.data?.filter(po => !['fulfilled', 'closed', 'canceled'].includes(po.status)).length ?? 0,
  }
}
