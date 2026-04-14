import { createServiceRoleClient } from '@service-official/database'

export const SELF_SCOPED_ROLES = ['technician', 'foreman', 'subcontractor']

/**
 * For field-scoped roles (tech / foreman / sub), returns the list of project IDs
 * the user is allowed to see. Returns `null` for roles with full org access.
 */
export async function getAllowedProjectIds(userId: string, role: string, organizationId: string): Promise<string[] | null> {
  if (!SELF_SCOPED_ROLES.includes(role)) return null

  const supabase = createServiceRoleClient()
  const [teamRes, pmRes, foremanRes] = await Promise.all([
    supabase.from('project_team').select('project_id').eq('user_id', userId),
    supabase.from('projects').select('id').eq('organization_id', organizationId).eq('project_manager_id', userId),
    supabase.from('projects').select('id').eq('organization_id', organizationId).eq('foreman_id', userId),
  ])

  const ids = new Set<string>()
  for (const r of teamRes.data ?? []) if (r.project_id) ids.add(r.project_id as string)
  for (const r of pmRes.data ?? []) ids.add(r.id as string)
  for (const r of foremanRes.data ?? []) ids.add(r.id as string)
  return Array.from(ids)
}

export async function canAccessProject(userId: string, role: string, organizationId: string, projectId: string): Promise<boolean> {
  const allowed = await getAllowedProjectIds(userId, role, organizationId)
  if (allowed === null) return true
  return allowed.includes(projectId)
}
