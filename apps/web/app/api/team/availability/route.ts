import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

/**
 * GET /api/team/availability?days=7
 * Returns team members with their scheduled jobs for the next N days.
 */
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const orgId = profile!.organization_id

  const { searchParams } = new URL(request.url)
  const days = Math.min(parseInt(searchParams.get('days') ?? '7'), 14)

  // Date range: today through N days
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + days)

  // Fetch active team members (field roles that get assigned jobs)
  const { data: members } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, title')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .in('role', ['owner', 'admin', 'foreman', 'technician', 'project_manager', 'subcontractor', 'dispatcher'])
    .order('first_name', { ascending: true })

  if (!members?.length) {
    return NextResponse.json({ data: [], days_range: [] })
  }

  // Fetch all jobs in the date range that are assigned
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, assigned_to, scheduled_start, scheduled_end, status, customer:customers(first_name, last_name, company_name)')
    .eq('organization_id', orgId)
    .not('assigned_to', 'is', null)
    .gte('scheduled_start', today.toISOString())
    .lt('scheduled_start', endDate.toISOString())
    .in('status', ['scheduled', 'in_progress', 'on_the_way'])
    .order('scheduled_start', { ascending: true })

  // Group jobs by assigned_to → date
  const jobsByMember = new Map<string, Map<string, any[]>>()

  for (const job of jobs ?? []) {
    if (!job.assigned_to || !job.scheduled_start) continue

    const dateKey = new Date(job.scheduled_start).toISOString().split('T')[0]

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

  // Build days array
  const daysRange: string[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    daysRange.push(d.toISOString().split('T')[0])
  }

  // Build response
  const data = members.map(m => {
    const memberDays = jobsByMember.get(m.id)
    const schedule: Record<string, any[]> = {}

    for (const day of daysRange) {
      schedule[day] = memberDays?.get(day) ?? []
    }

    const totalJobs = Array.from(memberDays?.values() ?? []).reduce((sum, jobs) => sum + jobs.length, 0)

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
