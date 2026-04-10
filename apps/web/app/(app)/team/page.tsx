import { getProfile } from '@/lib/auth/get-profile'
import { PageHeader } from '@/components/ui/page-header'
import { formatCurrency, formatDate, formatPhone } from '@/lib/utils'
import { Mail, Phone, MapPin, Clock, Briefcase, DollarSign } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Team' }

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-green-100 text-green-700',
  admin: 'bg-blue-100 text-blue-700',
  office_manager: 'bg-purple-100 text-purple-700',
  project_manager: 'bg-indigo-100 text-indigo-700',
  foreman: 'bg-amber-100 text-amber-700',
  technician: 'bg-gray-100 text-gray-700',
  dispatcher: 'bg-orange-100 text-orange-700',
  subcontractor: 'bg-pink-100 text-pink-700',
  viewer: 'bg-gray-100 text-gray-500',
}

export default async function TeamPage() {
  const { supabase, profile } = await getProfile()

  const isOwnerOrAdmin = ['owner', 'admin'].includes(profile?.role ?? '')

  // Get all team members
  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .eq('is_active', true)
    .order('first_name', { ascending: true })

  // Get upcoming/active jobs for each member
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, status, scheduled_start, scheduled_end, assigned_to, address_line1, city')
    .eq('organization_id', profile.organization_id)
    .in('status', ['scheduled', 'en_route', 'on_site', 'in_progress'])
    .order('scheduled_start', { ascending: true })

  // Get recent time entries
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('profile_id, hours, total_pay, date')
    .eq('organization_id', profile.organization_id)
    .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])

  // Group jobs by assignee
  const jobsByPerson: Record<string, any[]> = {}
  jobs?.forEach(j => {
    if (!j.assigned_to) return
    if (!jobsByPerson[j.assigned_to]) jobsByPerson[j.assigned_to] = []
    jobsByPerson[j.assigned_to].push(j)
  })

  // Aggregate time entries by person (last 30 days)
  const hoursByPerson: Record<string, { hours: number; pay: number }> = {}
  timeEntries?.forEach(t => {
    if (!hoursByPerson[t.profile_id]) hoursByPerson[t.profile_id] = { hours: 0, pay: 0 }
    hoursByPerson[t.profile_id].hours += t.hours ?? 0
    hoursByPerson[t.profile_id].pay += t.total_pay ?? 0
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description={`${members?.length ?? 0} active members`}
        actions={
          <Link href="/settings/team">
            <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Manage Team
            </button>
          </Link>
        }
      />

      <div className="space-y-4">
        {members?.map((member: any) => {
          const memberJobs = jobsByPerson[member.id] ?? []
          const memberHours = hoursByPerson[member.id] ?? { hours: 0, pay: 0 }

          return (
            <div key={member.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Member Header */}
              <div className="p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-lg font-bold shrink-0">
                  {member.first_name?.[0]}{member.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-gray-900">{member.first_name} {member.last_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_COLORS[member.role] ?? ROLE_COLORS.viewer}`}>
                      {member.role?.replace(/_/g, ' ')}
                    </span>
                    {member.title && <span className="text-xs text-gray-400">{member.title}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="flex items-center gap-1 hover:text-blue-600">
                        <Mail className="w-3.5 h-3.5" /> {member.email}
                      </a>
                    )}
                    {member.phone && (
                      <a href={`tel:${member.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                        <Phone className="w-3.5 h-3.5" /> {formatPhone(member.phone)}
                      </a>
                    )}
                    {isOwnerOrAdmin && member.hourly_rate && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <DollarSign className="w-3.5 h-3.5" /> {formatCurrency(member.hourly_rate)}/hr
                      </span>
                    )}
                  </div>

                  {/* 30-day stats */}
                  {isOwnerOrAdmin && (memberHours.hours > 0 || memberJobs.length > 0) && (
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {memberHours.hours > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {memberHours.hours.toFixed(1)}h logged (30 days)
                        </span>
                      )}
                      {isOwnerOrAdmin && memberHours.pay > 0 && (
                        <span>{formatCurrency(memberHours.pay)} labor</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Active job count badge */}
                <div className="text-right shrink-0">
                  <p className={`text-2xl font-bold ${memberJobs.length > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
                    {memberJobs.length}
                  </p>
                  <p className="text-xs text-gray-400">active jobs</p>
                </div>
              </div>

              {/* Assigned Jobs */}
              {memberJobs.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Upcoming & Active Jobs</p>
                  <div className="space-y-1.5">
                    {memberJobs.slice(0, 5).map((job: any) => (
                      <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-900 truncate">{job.title}</span>
                          {job.city && (
                            <span className="text-xs text-gray-400 flex items-center gap-0.5 shrink-0">
                              <MapPin className="w-3 h-3" /> {job.city}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {job.scheduled_start && (
                            <span className="text-xs text-gray-500">
                              {formatDate(job.scheduled_start, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${
                            job.status === 'in_progress' ? 'bg-amber-100 text-amber-700'
                              : job.status === 'en_route' ? 'bg-cyan-100 text-cyan-700'
                              : job.status === 'on_site' ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {job.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </Link>
                    ))}
                    {memberJobs.length > 5 && (
                      <p className="text-xs text-gray-400 pl-2">+{memberJobs.length - 5} more</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
