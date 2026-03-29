import { createServerSupabaseClient } from '@service-official/database'
import { DollarSign, FolderKanban, Briefcase, UserPlus, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

async function getDashboardMetrics(org_id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/reports/dashboard`, {
    headers: { 'x-org-id': org_id },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.data
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

  // Get recent projects
  const { data: recentProjects } = orgId ? await supabase
    .from('projects')
    .select('id, name, status, contract_value, customer:customers(first_name, last_name, company_name)')
    .eq('organization_id', orgId)
    .in('status', ['in_progress', 'approved', 'punch_list'])
    .order('updated_at', { ascending: false })
    .limit(5) : { data: [] }

  // Get today's jobs
  const selfOnlyRoles = ['technician', 'foreman', 'subcontractor']
  const isSelfOnly = selfOnlyRoles.includes(profile?.role ?? '')

  const today = new Date().toISOString().split('T')[0]
  let jobsQuery = orgId ? supabase
    .from('jobs')
    .select('id, title, status, scheduled_start, customer:customers(first_name, last_name), assignee:profiles!assigned_to(first_name, last_name)')
    .eq('organization_id', orgId)
    .gte('scheduled_start', `${today}T00:00:00`)
    .lte('scheduled_start', `${today}T23:59:59`)
    .order('scheduled_start', { ascending: true })
    .limit(8) : null

  if (jobsQuery && isSelfOnly) {
    jobsQuery = jobsQuery.eq('assigned_to', user.id)
  }

  const { data: todayJobs } = jobsQuery ? await jobsQuery : { data: [] }

  // Get unread notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(5)

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {profile?.first_name} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Revenue This Month"
          value="$0"
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          trend="+0% vs last month"
        />
        <MetricCard
          label="Active Projects"
          value={String(recentProjects?.length ?? 0)}
          icon={FolderKanban}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <MetricCard
          label="Jobs Today"
          value={String(todayJobs?.length ?? 0)}
          icon={Briefcase}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <MetricCard
          label="Outstanding"
          value="$0"
          icon={AlertCircle}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Active Projects</h2>
            <a href="/projects" className="text-sm text-blue-600 hover:underline">View all</a>
          </div>
          {recentProjects?.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No active projects</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentProjects?.map(project => (
                <a href={`/projects/${project.id}`} key={project.id} className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{project.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(project.customer as any)?.first_name} {(project.customer as any)?.last_name ?? (project.customer as any)?.company_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {project.contract_value && (
                      <span className="text-sm font-medium text-gray-700">
                        ${project.contract_value.toLocaleString()}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      project.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {project.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Today's Jobs */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Today's Jobs</h2>
              <a href="/calendar" className="text-sm text-blue-600 hover:underline">Calendar</a>
            </div>
            {todayJobs?.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center">No jobs scheduled today</p>
            ) : (
              <div className="space-y-2">
                {todayJobs?.map(job => (
                  <a href={`/jobs/${job.id}`} key={job.id} className="flex items-start gap-3 p-2.5 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      job.status === 'in_progress' ? 'bg-blue-500' :
                      job.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{job.title}</p>
                      <p className="text-xs text-gray-500">
                        {job.scheduled_start ? new Date(job.scheduled_start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Unscheduled'}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          {notifications && notifications.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Notifications</h2>
                <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                  {notifications.length}
                </span>
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
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, iconColor, iconBg, trend }: {
  label: string
  value: string
  icon: any
  iconColor: string
  iconBg: string
  trend?: string
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
