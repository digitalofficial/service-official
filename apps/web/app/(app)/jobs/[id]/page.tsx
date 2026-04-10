import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProfile } from '@/lib/auth/get-profile'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatPhone, statusColor } from '@/lib/utils'
import { JobActions } from './job-actions'
import { JobPhotos } from './job-photos'
import { JobFiles } from './job-files'
import { JobExpenses } from './job-expenses'
import { JobTimeEntries } from './job-time-entries'
import { ConvertEstimateButton } from './convert-estimate-button'
import { WorkflowBar } from './workflow-bar'
import { ActivityFeed } from './activity-feed'
import {
  ArrowLeft, MapPin, Clock, User, Phone, Calendar, FileText,
  Camera, DollarSign, MessageSquare, Briefcase, Mail, ExternalLink,
  Hash, Tag, Pencil,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Job Detail' }

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500', high: 'bg-orange-500', normal: 'bg-blue-500', low: 'bg-gray-400',
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const { supabase, user, profile } = await getProfile()

  const { data: job } = await supabase
    .from('jobs')
    .select(`
      *,
      customer:customers(*),
      assignee:profiles!assigned_to(id, first_name, last_name, phone, email, avatar_url, role),
      project:projects(id, name, status)
    `)
    .eq('id', params.id)
    .single()

  if (!job) notFound()

  // Get photos, files, expenses, estimates, and invoices for this job
  const [{ data: photos }, { data: files }, { data: expenses }, { data: estimates }, { data: invoices }] = await Promise.all([
    supabase.from('photos').select('*').eq('job_id', params.id).order('created_at', { ascending: false }),
    supabase.from('files').select('*').eq('job_id', params.id).order('created_at', { ascending: false }),
    supabase.from('expenses').select('*').eq('job_id', params.id).order('created_at', { ascending: false }),
    supabase.from('estimates').select('id, estimate_number, status, total, created_at').eq('job_id', params.id).order('created_at', { ascending: false }),
    supabase.from('invoices').select('id, invoice_number, status, total, created_at').eq('job_id', params.id).order('created_at', { ascending: false }),
  ])

  const colors = statusColor(job.status)
  const customer = job.customer as any
  const assignee = job.assignee as any
  const project = job.project as any
  const isOwner = profile?.role === 'owner'
  const location = [job.address_line1, job.city, job.state, job.zip].filter(Boolean).join(', ')
  const customerAddress = customer
    ? [customer.address_line1, customer.city, customer.state, customer.zip].filter(Boolean).join(', ')
    : ''

  const estimateParams = new URLSearchParams()
  estimateParams.set('job_id', params.id)
  if (customer?.id) estimateParams.set('customer_id', customer.id)

  const invoiceParams = new URLSearchParams()
  invoiceParams.set('job_id', params.id)
  if (customer?.id) invoiceParams.set('customer_id', customer.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/jobs" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`w-3 h-3 rounded-full ${PRIORITY_COLORS[job.priority] ?? 'bg-gray-400'}`} />
              <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${colors.bg} ${colors.text}`}>
                {job.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              {job.job_number && <span>{job.job_number}</span>}
              {project && <Link href={`/projects/${project.id}`} className="text-blue-600 hover:underline">{project.name}</Link>}
              <span className="capitalize">{job.priority} priority</span>
            </div>
          </div>
        </div>
        <Link href={`/jobs/${params.id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="w-4 h-4 mr-1" /> Edit
          </Button>
        </Link>
      </div>

      {/* Workflow Status Bar */}
      <WorkflowBar
        status={job.status}
        scheduledStart={job.scheduled_start}
        actualStart={job.actual_start}
        actualEnd={job.actual_end}
        createdAt={job.created_at}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Main Content (~65%) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Schedule & Location */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Schedule & Location</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Scheduled</p>
                  <p className="text-sm text-gray-900">
                    {job.scheduled_start
                      ? formatDate(job.scheduled_start, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                      : 'Not scheduled'}
                  </p>
                  {job.scheduled_end && (
                    <p className="text-xs text-gray-500">to {formatDate(job.scheduled_end, { hour: 'numeric', minute: '2-digit' })}</p>
                  )}
                </div>
              </div>
              {location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm text-gray-900">{location}</p>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5"
                    >
                      <ExternalLink className="w-3 h-3" /> Open in Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Crew Instructions */}
          {(job.instructions || job.completion_notes) && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Crew Instructions</h2>
              {job.instructions && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.instructions}</p>
              )}
              {job.completion_notes && (
                <div className={job.instructions ? 'mt-4 pt-4 border-t border-gray-100' : ''}>
                  <p className="text-xs text-gray-500 mb-1">Completion Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.completion_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Estimates */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Estimates ({estimates?.length ?? 0})
              </h2>
              <Link href={`/estimates/new?${estimateParams.toString()}`}>
                <Button size="sm" variant="outline">Create Estimate</Button>
              </Link>
            </div>
            {estimates && estimates.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {estimates.map((est: any) => {
                  const estColors = statusColor(est.status)
                  const canConvert = ['approved', 'sent'].includes(est.status)
                  return (
                    <div key={est.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <Link href={`/estimates/${est.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                          {est.estimate_number || 'Draft Estimate'}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {formatDate(est.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${estColors.bg} ${estColors.text}`}>
                          {est.status}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(est.total ?? 0)}</span>
                        {canConvert && (
                          <ConvertEstimateButton estimateId={est.id} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No estimates yet</p>
            )}
          </div>

          {/* Invoices */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Invoices ({invoices?.length ?? 0})
              </h2>
              <Link href={`/invoices/new?${invoiceParams.toString()}`}>
                <Button size="sm" variant="outline">Create Invoice</Button>
              </Link>
            </div>
            {invoices && invoices.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {invoices.map((inv: any) => {
                  const invColors = statusColor(inv.status)
                  return (
                    <div key={inv.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <Link href={`/invoices/${inv.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                          {inv.invoice_number || 'Draft Invoice'}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {formatDate(inv.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${invColors.bg} ${invColors.text}`}>
                          {inv.status}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(inv.total ?? 0)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No invoices yet</p>
            )}
          </div>

          {/* Photos */}
          <JobPhotos jobId={params.id} photos={photos ?? []} />

          {/* Documents */}
          <JobFiles jobId={params.id} files={files ?? []} />

          {/* Expenses */}
          <JobExpenses jobId={params.id} projectId={project?.id} expenses={expenses ?? []} />

          {/* Crew Hours */}
          <JobTimeEntries
            jobId={params.id}
            assigneeId={assignee?.id}
            currentUserId={user.id}
            currentUserRole={profile?.role ?? 'viewer'}
          />

          {/* Activity Feed */}
          <ActivityFeed
            job={job}
            photoCount={photos?.length ?? 0}
            expenseCount={expenses?.length ?? 0}
          />
        </div>

        {/* RIGHT: Sidebar (~35%) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Customer Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Customer</h2>
            {customer ? (
              <div className="space-y-2.5">
                <Link href={`/customers/${customer.id}`} className="text-sm font-medium text-blue-600 hover:underline block">
                  {customer.company_name ?? `${customer.first_name} ${customer.last_name}`}
                </Link>
                {customerAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">{customerAddress}</p>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(customerAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Directions
                      </a>
                    </div>
                  </div>
                )}
                {customer.phone && (
                  <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {formatPhone(customer.phone)}
                  </a>
                )}
                {customer.email && (
                  <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400" /> {customer.email}
                  </a>
                )}
                {customer.source && (
                  <div className="pt-1">
                    <Badge variant="secondary">{customer.source}</Badge>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No customer assigned</p>
            )}
          </div>

          {/* Assigned To */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Assigned To</h2>
            {assignee ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">
                  {assignee.first_name?.[0]}{assignee.last_name?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{assignee.first_name} {assignee.last_name}</p>
                    {assignee.role && (
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {assignee.role.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                  {assignee.phone && (
                    <a href={`tel:${assignee.phone}`} className="text-xs text-gray-500 flex items-center gap-1 hover:text-blue-600">
                      <Phone className="w-3 h-3" /> {formatPhone(assignee.phone)}
                    </a>
                  )}
                  {assignee.email && (
                    <a href={`mailto:${assignee.email}`} className="text-xs text-gray-500 flex items-center gap-1 hover:text-blue-600">
                      <Mail className="w-3 h-3" /> {assignee.email}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Unassigned</p>
            )}
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Job Details</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" /> Job Number
                </span>
                <span className="text-gray-900 font-medium">{job.job_number || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Priority
                </span>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${PRIORITY_COLORS[job.priority] ?? 'bg-gray-400'}`} />
                  <span className="text-gray-900 capitalize">{job.priority}</span>
                </div>
              </div>
              {project && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Project</span>
                  <Link href={`/projects/${project.id}`} className="text-blue-600 hover:underline font-medium">
                    {project.name}
                  </Link>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">{formatDate(job.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              {job.actual_start && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Started</span>
                  <span className="text-gray-900">{formatDate(job.actual_start, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              )}
              {job.actual_end && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Completed</span>
                  <span className="text-gray-900">{formatDate(job.actual_end, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {job.tags?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {job.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Job Actions */}
          <JobActions
            jobId={params.id}
            status={job.status}
            isOwner={isOwner}
            customerId={customer?.id}
            customerName={customer?.company_name ?? (customer ? `${customer.first_name} ${customer.last_name}` : undefined)}
          />
        </div>
      </div>
    </div>
  )
}
