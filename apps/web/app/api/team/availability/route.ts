import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@service-official/database'

/**
 * GET /api/team/availability?days=7
 * Returns team members with their scheduled jobs for the next N days.
 */
export async function GET(request: NextRequest) {
  // Auth check with user's session
  const authClient = createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Use service role for data queries to bypass RLS
  const supabase = createServiceRoleClient()

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const orgId = profile!.organization_id

  const { searchParams } = new URL(request.url)
  const days = Math.min(parseInt(searchParams.get('days') ?? '7'), 14)

  const now = new Date()
  // Start from 24 hours ago to catch jobs that might span timezone boundaries
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - 1)

  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + days + 1)

  const startStr = startDate.toISOString()
  const endStr = endDate.toISOString()

  // Fetch active team members (any role that could be assigned jobs)
  const { data: members } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, title')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .in('role', ['owner', 'admin', 'office_manager', 'foreman', 'technician', 'project_manager', 'subcontractor', 'dispatcher'])
    .order('first_name', { ascending: true })

  if (!members?.length) {
    return NextResponse.json({ data: [], days_range: [] })
  }

  // Fetch ALL jobs in the date range that are assigned (don't filter by status)
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, assigned_to, scheduled_start, scheduled_end, status, customer:customers(first_name, last_name, company_name)')
    .eq('organization_id', orgId)
    .not('assigned_to', 'is', null)
    .not('scheduled_start', 'is', null)
    .gte('scheduled_start', startStr)
    .lt('scheduled_start', endStr)
    .not('status', 'eq', 'canceled')
    .order('scheduled_start', { ascending: true })

  // Helper: format date as YYYY-MM-DD in a consistent way
  const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  // Build days array
  const daysRange: string[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    daysRange.push(toDateStr(d))
  }

  // Group jobs by assigned_to → date (using server local date for the scheduled_start)
  const jobsByMember = new Map<string, Map<string, any[]>>()

  for (const job of jobs ?? []) {
    if (!job.assigned_to || !job.scheduled_start) continue

    // Convert UTC timestamp to local date on the server
    const dateKey = toDateStr(new Date(job.scheduled_start))

    if (!jobsByMember.has(job.assigned_to)) {
      jobsByMember.set(job.assigned_to, new Map())
    }
    const memberJobs = jobsByMember.get(job.assigned_to)!
    if (!memberJobs.has(dateKey)) {
      memberJobs.set(dateKey, [])
    }
    memberJobs.get(dateKey)!.push({
      id: job.id,
      title: job.title,
      status: job.status,
      start: job.scheduled_start,
      end: job.scheduled_end,
      customer: (job.customer as any)?.company_name
        || `${(job.customer as any)?.first_name ?? ''} ${(job.customer as any)?.last_name ?? ''}`.trim()
        || null,
    })
  }

  // Build response
  const data = members.map(m => {
    const memberDays = jobsByMember.get(m.id)
    const schedule: Record<string, any[]> = {}

    for (const day of daysRange) {
      schedule[day] = memberDays?.get(day) ?? []
    }

    const totalJobs = Array.from(memberDays?.values() ?? []).reduce((sum, dayJobs) => sum + dayJobs.length, 0)

    return {
      id: m.id,
      first_name: m.first_name,
      last_name: m.last_name,
      role: m.role,
      title: m.title,
      total_jobs: totalJobs,
      schedule,
    }
  })

  return NextResponse.json({ data, days_range: daysRange })
}
