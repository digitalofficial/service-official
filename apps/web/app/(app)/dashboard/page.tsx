import { createServerSupabaseClient } from '@service-official/database'
import Link from 'next/link'
import {
  DollarSign, FolderKanban, Briefcase, AlertCircle, TrendingUp, MapPin,
  Clock, Users, CalendarDays, ArrowRight, FileText, Bell
} from 'lucide-react'
import { DashboardJobMap } from './dashboard-job-map'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const STATUS_DOT: Record<string, string> = {
  scheduled: 'bg-blue-500',
  en_route: 'bg-yellow-500',
  on_site: 'bg-purple-500',
  in_progress: 'bg-green-500',
  completed: 'bg-emerald-500',
  unscheduled: 'bg-gray-300',
}

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  const orgId = profile?.organization_id
  if (!orgId) return null

  const selfOnlyRoles = ['technician', 'foreman', 'subcontractor']
  const isSelfOnly = selfOnlyRoles.includes(profile?.role ?? '')
  const isOwnerAdmin = ['owner', 'admin'].includes(profile?.role ?? '')

  // Date ranges
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString()
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Parallel data fetches
  const [
    { data: currentInvoices },
    { data: lastMonthInvoices },
    { data: ytdInvoices },
    { data: outstandingInvoices },
    { data: recentProjects },
    { data: notifications },
    { data: overdueInvoices },
  ] = await Promise.all([
    supabase.from('invoices').select('amount_paid').eq('organization_id', orgId).gte('created_at', startOfMonth),
    supabase.from('invoices').select('amount_paid').eq('organization_id', orgId).gte('created_at', startOfLastMonth).lte('created_at', endOfLastMonth),
    supabase.from('invoices').select('amount_paid').eq('organization_id', orgId).gte('created_at', startOfYear),
    supabase.from('invoices').select('amount_paid, amount_due, total, status').eq('organization_id', orgId).in('status', ['sent', 'viewed', 'partial', 'overdue']),
    supabase.from('projects').select('id, name, status, contract_value, customer:customers(first_name, last_name, company_name)').eq('organization_id', orgId).in('status', ['in_progress', 'approved', 'punch_list']).order('updated_at', { ascending: false }).limit(5),
    supabase.from('notifications').select('*').eq('user_id', user.id).eq('is_read', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('invoices').select('id, invoice_number, total, amount_due, due_date, customer:customers(first_name, last_name, company_name)').eq('organization_id', orgId).eq('status', 'overdue').order('due_date', { ascending: true }).limit(5),
  ])

  // Today's jobs
  let todayJobsQuery = supabase
    .from('jobs')
    .select('id, title, status, scheduled_start, scheduled_end, address_line1, city, state, zip, coordinates, customer:customers(first_name, last_name, company_name), assignee:profiles!assigned_to(first_name, last_name)')
    .eq('organization_id', orgId)
    .gte('scheduled_start', `${today}T00:00:00`)
    .lte('scheduled_start', `${today}T23:59:59`)
    .order('scheduled_start', { ascending: true })

  if (isSelfOnly) todayJobsQuery = todayJobsQuery.eq('assigned_to', user.id)
  const { data: todayJobs } = await todayJobsQuery

  // Upcoming jobs (next 7 days, excluding today)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  let upcomingQuery = supabase
    .from('jobs')
    .select('id, title, status, scheduled_start, address_line1, city, customer:customers(first_name, last_name, company_name), assignee:profiles!assigned_to(first_name, last_name)')
    .eq('organization_id', orgId)
    .gte('scheduled_start', `${tomorrowStr}T00:00:00`)
    .lt('scheduled_start', next7Days)
    .in('status', ['scheduled', 'unscheduled'])
    .order('scheduled_start', { ascending: true })
    .limit(8)

  if (isSelfOnly) upcomingQuery = upcomingQuery.eq('assigned_to', user.id)
  const { data: upcomingJobs } = await upcomingQuery

  // All jobs for map — any job with an address
  let mapQuery = supabase
    .from('jobs')
    .select('id, title, status, scheduled_start, address_line1, city, state, zip, coordinates, customer:customers(first_name, last_name, company_name), assignee:profiles!assigned_to(first_name, last_name)')
    .eq('organization_id', orgId)
    .not('address_line1', 'is', null)
    .order('scheduled_start', { ascending: true })
    .limit(50)

  if (isSelfOnly) mapQuery = mapQuery.eq('assigned_to', user.id)
  const { data: activeJobs } = await mapQuery

  // Team schedule (this week) — owners/admins only
  let teamSchedule: any[] = []
  if (isOwnerAdmin) {
    const { data: teamJobs } = await supabase
      .from('jobs')
      .select('id, title, scheduled_start, status, assigned_to, assignee:profiles!assigned_to(id, first_name, last_name)')
      .eq('organization_id', orgId)
      .gte('scheduled_start', `${today}T00:00:00`)
      .lt('scheduled_start', next7Days)
      .not('assigned_to', 'is', null)
      .order('scheduled_start', { ascending: true })

    // Group by employee
    const byEmployee = new Map<string, { name: string; jobs: any[] }>()
    for (const j of teamJobs ?? []) {
      const a = j.assignee as any
      if (!a) continue
      const key = a.id
      if (!byEmployee.has(key)) byEmployee.set(key, { name: `${a.first_name} ${a.last_name}`, jobs: [] })
      byEmployee.get(key)!.jobs.push(j)
    }
    teamSchedule = Array.from(byEmployee.entries()).map(([id, data]) => ({ id, ...data }))
  }

  // Calculations
  const currentMonthRevenue = (currentInvoices ?? []).reduce((sum, i) => sum + (i.amount_paid ?? 0), 0)
  const lastMonthRevenue = (lastMonthInvoices ?? []).reduce((sum, i) => sum + (i.amount_paid ?? 0), 0)
  const ytdRevenue = (ytdInvoices ?? []).reduce((sum, i) => sum + (i.amount_paid ?? 0), 0)
  const outstanding = (outstandingInvoices ?? []).reduce((sum, i) => sum + (i.amount_due ?? ((i.total ?? 0) - (i.amount_paid ?? 0))), 0)

  const revenueTrend = lastMonthRevenue > 0
    ? `${currentMonthRevenue >= lastMonthRevenue ? '+' : ''}${Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)}% vs last month`
    : currentMonthRevenue > 0 ? 'Up from last month' : undefined

  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {profile?.first_name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/dispatch" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Briefcase className="w-4 h-4" /> Dispatch Job
        </Link>
      </div>

      {/* Overdue Alert */}
      {overdueInvoices && overdueInvoices.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''} — {formatCurrency(overdueInvoices.reduce((s, i) => s + (i.amount_due ?? 0), 0))} outstanding
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {overdueInvoices.slice(0, 3).map(inv => (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className="text-xs text-red-600 hover:underline">
                  {inv.invoice_number} ({formatCurrency(inv.amount_due)})
                </Link>
              ))}
            </div>
          </div>
          <Link href="/invoices?status=overdue" className="text-xs text-red-600 font-medium hover:underline shrink-0">
            View all
          </Link>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MetricCard label="Revenue This Month" value={formatCurrency(currentMonthRevenue)} icon={DollarSign} iconColor="text-green-600" iconBg="bg-green-50" trend={revenueTrend} />
        <MetricCard label="Revenue This Year" value={formatCurrency(ytdRevenue)} icon={TrendingUp} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <MetricCard label="Active Projects" value={String(recentProjects?.length ?? 0)} icon={FolderKanban} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <MetricCard label="Jobs Today" value={String(todayJobs?.length ?? 0)} icon={Briefcase} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <MetricCard label="Outstanding" value={formatCurrency(outstanding)} icon={AlertCircle} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      {/* Jobs Map — All Jobs */}
      {activeJobs && activeJobs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Jobs Map</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{activeJobs.length} jobs</span>
            </div>
            <Link href="/jobs" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <DashboardJobMap jobs={activeJobs as any} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Today's Jobs + Upcoming */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Jobs */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <h2 className="font-semibold text-gray-900">Today's Jobs</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{todayJobs?.length ?? 0}</span>
              </div>
              <Link href="/calendar" className="text-sm text-blue-600 hover:underline">Calendar</Link>
            </div>
            {!todayJobs?.length ? (
              <p className="text-sm text-gray-400 py-6 text-center">No jobs scheduled today</p>
            ) : (
              <div className="space-y-2">
                {todayJobs.map(job => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[job.status] ?? 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                        {job.scheduled_start && <span>{formatTime(job.scheduled_start)}</span>}
                        {job.customer && <span className="truncate">{(job.customer as any).company_name ?? `${(job.customer as any).first_name} ${(job.customer as any).last_name}`}</span>}
                      </div>
                    </div>
                    {job.assignee && (
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold shrink-0">
                        {(job.assignee as any).first_name?.[0]}{(job.assignee as any).last_name?.[0]}
                      </div>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                      job.status === 'completed' ? 'bg-green-100 text-green-700' :
                      job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      job.status === 'en_route' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {job.status.replace(/_/g, ' ')}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Jobs (Next 7 Days) */}
          {upcomingJobs && upcomingJobs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  <h2 className="font-semibold text-gray-900">Upcoming This Week</h2>
                </div>
                <Link href="/jobs" className="text-sm text-blue-600 hover:underline">View all</Link>
              </div>
              <div className="space-y-2">
                {upcomingJobs.map(job => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="text-center shrink-0 w-12">
                      <p className="text-[10px] text-gray-400 uppercase">{job.scheduled_start ? new Date(job.scheduled_start).toLocaleDateString('en-US', { weekday: 'short' }) : ''}</p>
                      <p className="text-lg font-bold text-gray-900">{job.scheduled_start ? new Date(job.scheduled_start).getDate() : '-'}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {job.scheduled_start && formatTime(job.scheduled_start)}
                        {job.customer && ` — ${(job.customer as any).company_name ?? `${(job.customer as any).first_name} ${(job.customer as any).last_name}`}`}
                      </p>
                    </div>
                    {job.assignee && (
                      <span className="text-xs text-gray-400">{(job.assignee as any).first_name}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Active Projects */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-600" />
                <h2 className="font-semibold text-gray-900">Active Projects</h2>
              </div>
              <Link href="/projects" className="text-sm text-blue-600 hover:underline">View all</Link>
            </div>
            {!recentProjects?.length ? (
              <p className="text-sm text-gray-400 py-6 text-center">No active projects</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentProjects.map(project => (
                  <Link href={`/projects/${project.id}`} key={project.id} className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{project.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(project.customer as any)?.company_name ?? `${(project.customer as any)?.first_name ?? ''} ${(project.customer as any)?.last_name ?? ''}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {project.contract_value && <span className="text-sm font-medium text-gray-700">${project.contract_value.toLocaleString()}</span>}
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        project.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {project.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Team Schedule — owner/admin only */}
          {isOwnerAdmin && teamSchedule.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h2 className="font-semibold text-gray-900">Team This Week</h2>
                </div>
                <Link href="/dispatch" className="text-sm text-blue-600 hover:underline">Dispatch</Link>
              </div>
              <div className="space-y-3">
                {teamSchedule.map(member => (
                  <div key={member.id} className="border border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold">
                          {member.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{member.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">{member.jobs.length} job{member.jobs.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-1">
                      {member.jobs.slice(0, 3).map((j: any) => (
                        <div key={j.id} className="flex items-center gap-2 text-xs text-gray-500">
                          <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[j.status] ?? 'bg-gray-300'}`} />
                          <span className="truncate">{j.title}</span>
                          {j.scheduled_start && <span className="shrink-0 text-gray-400">{formatShortDate(j.scheduled_start)}</span>}
                        </div>
                      ))}
                      {member.jobs.length > 3 && (
                        <p className="text-[10px] text-gray-400">+{member.jobs.length - 3} more</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {notifications && notifications.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-red-500" />
                  <h2 className="font-semibold text-gray-900">Notifications</h2>
                  <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">{notifications.length}</span>
                </div>
              </div>
              <div className="space-y-2">
                {notifications.map(n => (
                  <div key={n.id} className="flex gap-2.5 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-800">{n.title}</p>
                      {n.body && <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="space-y-1.5">
              {[
                { label: 'Dispatch a Job', href: '/dispatch', icon: Briefcase },
                { label: 'Create Invoice', href: '/invoices/new', icon: FileText },
                { label: 'Add Customer', href: '/customers/new', icon: Users },
                { label: 'New Estimate', href: '/estimates/new', icon: DollarSign },
              ].map(link => (
                <Link key={link.href} href={link.href} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group">
                  <link.icon className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">{link.label}</span>
                  <ArrowRight className="w-3 h-3 text-gray-300 ml-auto group-hover:text-blue-600" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, iconColor, iconBg, trend }: {
  label: string; value: string; icon: any; iconColor: string; iconBg: string; trend?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{value}</p>
      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{label}</p>
      {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
    </div>
  )
}
