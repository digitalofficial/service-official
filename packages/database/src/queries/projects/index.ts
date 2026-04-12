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
}

export async function getProjects(options: GetProjectsOptions): Promise<PaginatedResponse<Project>> {
  const supabase = createServiceRoleClient()
  const { organization_id, status, customer_id, search, page = 1, per_page = 20 } = options

  let query = supabase
    .from('projects')
    .select(`
      *,
      customer:customers(id, first_name, last_name, company_name, phone, email),
      project_manager:profiles!project_manager_id(id, first_name, last_name, avatar_url),
      foreman:profiles!foreman_id(id, first_name, last_name, avatar_url),
      phases:project_phases(*)
    `, { count: 'exact' })
    .eq('organization_id', organization_id)
    .order('created_at', { ascending: false })
    .range((page - 1) * per_page, page * per_page - 1)

  if (status) query = query.eq('status', status)
  if (customer_id) query = query.eq('customer_id', customer_id)
  if (search) query = query.ilike('name', `%${search}%`)

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

  const [expenses, materials, photos, files, punch_list, rfis, change_orders] = await Promise.all([
    supabase.from('expenses').select('total_amount').eq('project_id', project_id),
    supabase.from('project_materials').select('total_cost, status').eq('project_id', project_id),
    supabase.from('photos').select('id', { count: 'exact', head: true }).eq('project_id', project_id),
    supabase.from('files').select('id', { count: 'exact', head: true }).eq('project_id', project_id),
    supabase.from('punch_list_items').select('status').eq('project_id', project_id),
    supabase.from('rfis').select('status').eq('project_id', project_id),
    supabase.from('change_orders').select('amount, status').eq('project_id', project_id),
  ])

  const total_expenses = expenses.data?.reduce((sum, e) => sum + (e.total_amount || 0), 0) ?? 0
  const total_materials = materials.data?.reduce((sum, m) => sum + (m.total_cost || 0), 0) ?? 0
  const open_punch_items = punch_list.data?.filter(p => p.status === 'open').length ?? 0
  const open_rfis = rfis.data?.filter(r => r.status !== 'closed').length ?? 0
  const approved_change_orders = change_orders.data
    ?.filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + (c.amount || 0), 0) ?? 0

  return {
    total_expenses,
    total_materials,
    photo_count: photos.count ?? 0,
    file_count: files.count ?? 0,
    open_punch_items,
    open_rfis,
    approved_change_orders,
  }
}
