import Link from 'next/link'
import { createServerSupabaseClient } from '@service-official/database'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, statusColor } from '@/lib/utils'
import { Plus, Briefcase, Clock, MapPin } from 'lucide-react'
import { JobsMapView } from './jobs-map-view'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Jobs' }

interface Props {
  searchParams: { status?: string; view?: string }
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
  urgent: 'bg-red-500', high: 'bg-orange-500', normal: 'bg-blue-500', low: 'bg-gray-400',
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
  const isMapView = searchParams.view === 'map'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description={`${jobs?.length ?? 0} total jobs`}
        actions={
          <Link href="/dispatch">
            <Button><Plus className="w-4 h-4 mr-2" />Dispatch Job</Button>
          </Link>
        }
      />

      {/* Status Filter + View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 border-b border-gray-200">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.label}
              href={tab.value ? `/jobs?status=${tab.value}${isMapView ? '&view=map' : ''}` : `/jobs${isMapView ? '?view=map' : ''}`}
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
        <div className="flex md:hidden items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <Link
            href={`/jobs${searchParams.status ? `?status=${searchParams.status}` : ''}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!isMapView ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            List
          </Link>
          <Link
            href={`/jobs?view=map${searchParams.status ? `&status=${searchParams.status}` : ''}`}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isMapView ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Map
          </Link>
        </div>
      </div>

      {!jobs || jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="w-12 h-12" />}
          title="No jobs yet"
          description="Create your first job to start scheduling work."
          action={<Link href="/dispatch"><Button><Plus className="w-4 h-4 mr-2" />Dispatch Job</Button></Link>}
        />
      ) : (
        <>
          {/* Desktop: always show map */}
          <div className="hidden md:block">
            <JobsMapView jobs={jobs as any} height="50vh" />
          </div>
          {/* Mobile: show map only when toggled */}
          {isMapView && (
            <div className="md:hidden">
              <JobsMapView jobs={jobs as any} />
            </div>
          )}
          {/* Desktop: always show list / Mobile: show list only when not map view */}
          <div className={`space-y-2 ${isMapView ? 'hidden md:block' : ''}`}>
            {jobs.map((job: any) => {
              const colors = statusColor(job.status)
              return (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                    {/* Top row: priority dot + title + status */}
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${PRIORITY_COLORS[job.priority] ?? 'bg-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{job.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 capitalize ${colors.bg} ${colors.text}`}>
                            {job.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
                          {job.job_number && <span className="text-gray-400">{job.job_number}</span>}
                          {job.customer && <span className="truncate">{job.customer.company_name ?? `${job.customer.first_name} ${job.customer.last_name}`}</span>}
                          {(job.city || job.address_line1) && <span className="flex items-center gap-0.5 truncate"><MapPin className="w-3 h-3 shrink-0" />{job.city ?? job.address_line1}</span>}
                          {job.scheduled_start ? (
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3 shrink-0" />
                              {formatDate(job.scheduled_start, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                          ) : (
                            <span className="text-gray-400">Unscheduled</span>
                          )}
                          {job.assignee && (
                            <span className="flex items-center gap-1">
                              <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[9px] font-bold">
                                {job.assignee.first_name?.[0]}
                              </div>
                              <span className="hidden sm:inline">{job.assignee.first_name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
