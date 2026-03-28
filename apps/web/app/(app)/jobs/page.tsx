import Link from 'next/link'
import { createServerSupabaseClient } from '@service-official/database'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, statusColor } from '@/lib/utils'
import { Plus, Briefcase, Search, Clock, MapPin, User } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Jobs' }

interface Props {
  searchParams: { status?: string; date?: string }
}

const STATUS_TABS = [
  { label: 'All', value: undefined },
  { label: 'Unscheduled', value: 'unscheduled' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Needs Follow Up', value: 'needs_follow_up' },
]

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  normal: 'bg-blue-500',
  low: 'bg-gray-400',
}

export default async function JobsPage({ searchParams }: Props) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()

  let query = supabase
    .from('jobs')
    .select(`
      *,
      customer:customers(id, first_name, last_name, company_name, phone),
      assignee:profiles!assigned_to(id, first_name, last_name, avatar_url),
      project:projects(id, name)
    `)
    .eq('organization_id', profile!.organization_id)
    .order('scheduled_start', { ascending: true })

  if (searchParams.status) query = query.eq('status', searchParams.status)

  const { data: jobs } = await query

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description={`${jobs?.length ?? 0} total jobs`}
        actions={
          <Link href="/jobs/new">
            <Button><Plus className="w-4 h-4 mr-2" />New Job</Button>
          </Link>
        }
      />

      {/* Status Filter */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/jobs?status=${tab.value}` : '/jobs'}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              searchParams.status === tab.value || (!searchParams.status && !tab.value)
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {!jobs || jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-12 h-12" />}
          title="No jobs yet"
          description="Create your first job to start scheduling work."
          action={
            <Link href="/jobs/new">
              <Button><Plus className="w-4 h-4 mr-2" />Create Job</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {jobs.map((job: any) => {
            const colors = statusColor(job.status)
            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-4">
                  {/* Priority dot */}
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${PRIORITY_COLORS[job.priority] ?? 'bg-gray-400'}`} />

                  {/* Job info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{job.title}</h3>
                      {job.job_number && (
                        <span className="text-xs text-gray-400">{job.job_number}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {job.customer && (
                        <span>{job.customer.company_name ?? `${job.customer.first_name} ${job.customer.last_name}`}</span>
                      )}
                      {job.project && (
                        <span className="text-gray-400">{job.project.name}</span>
                      )}
                      {(job.city || job.address_line1) && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {job.city ?? job.address_line1}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="text-right shrink-0">
                    {job.scheduled_start ? (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        {formatDate(job.scheduled_start, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Unscheduled</span>
                    )}
                  </div>

                  {/* Assignee */}
                  {job.assignee && (
                    <div
                      className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0"
                      title={`${job.assignee.first_name} ${job.assignee.last_name}`}
                    >
                      {job.assignee.first_name?.[0]}{job.assignee.last_name?.[0]}
                    </div>
                  )}

                  {/* Status */}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 capitalize ${colors.bg} ${colors.text}`}>
                    {job.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
