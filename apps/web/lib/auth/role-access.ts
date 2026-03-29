// Role-based page access rules
// Maps route patterns to allowed roles. '*' means all roles.

const PAGE_ACCESS: Record<string, string[]> = {
  '/dashboard': ['*'],
  '/dispatch': ['owner', 'admin', 'office_manager', 'dispatcher'],
  '/projects': ['owner', 'admin', 'office_manager', 'estimator', 'project_manager', 'viewer'],
  '/jobs': ['*'],
  '/calendar': ['*'],
  '/customers': ['owner', 'admin', 'office_manager', 'estimator', 'project_manager', 'dispatcher'],
  '/leads': ['owner', 'admin', 'office_manager'],
  '/estimates': ['owner', 'admin', 'office_manager', 'estimator'],
  '/invoices': ['owner', 'admin', 'office_manager'],
  '/payments': ['owner', 'admin', 'office_manager'],
  '/estimator': ['owner', 'admin', 'office_manager', 'estimator'],
  '/team': ['owner', 'admin', 'office_manager', 'project_manager', 'dispatcher'],
  '/messages': ['owner', 'admin', 'office_manager', 'project_manager'],
  '/automation': ['owner', 'admin'],
  '/reports': ['owner', 'admin'],
  '/settings': ['owner', 'admin', 'office_manager'],
  '/admin': ['owner'],
}

export function canAccessPage(role: string, pathname: string): boolean {
  // Find the matching rule (check most specific first)
  const segments = pathname.split('/').filter(Boolean)
  let checkPath = ''

  for (const segment of segments) {
    checkPath += '/' + segment
    const rules = PAGE_ACCESS[checkPath]
    if (rules) {
      return rules.includes('*') || rules.includes(role)
    }
  }

  // Default: allow if no rule found (sub-pages inherit parent)
  return true
}

// Roles that can only see their own assigned jobs (not all jobs)
export const SELF_ONLY_ROLES = ['technician', 'foreman', 'subcontractor']

// Roles that can see financial data (costs, pay rates, revenue)
export const FINANCIAL_ROLES = ['owner', 'admin', 'office_manager']

// Roles that can edit/create data
export const EDIT_ROLES = ['owner', 'admin', 'office_manager', 'estimator', 'project_manager', 'foreman', 'dispatcher']
