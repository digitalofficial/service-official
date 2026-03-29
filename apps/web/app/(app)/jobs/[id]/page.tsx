import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@service-official/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatPhone, statusColor } from '@/lib/utils'
import { JobActions } from './job-actions'
import {
  ArrowLeft, MapPin, Clock, User, Phone, Calendar, FileText,
  Camera, DollarSign, MessageSquare, Briefcase
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Job Detail' }

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500', high: 'bg-orange-500', normal: 'bg-blue-500', low: 'bg-gray-400',
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()

  const { data: job } = await supabase
    .from('jobs')
    .select(`
      *,
      customer:customers(*),
      assignee:profiles!assigned_to(id, first_name, last_name, phone, email, avatar_url),
      project:projects(id, name, status)
    `)
    .eq('id', params.id)
    .single()

  if (!job) notFound()

  // Get photos, files, expenses for this job
  const [{ data: photos }, { data: files }, { data: expenses }] = await Promise.all([
    supabase.from('photos').select('*').eq('job_id', params.id).order('created_at', { ascending: false }),
    supabase.from('files').select('*').eq('job_id', params.id).order('created_at', { ascending: false }),
    supabase.from('expenses').select('*').eq('job_id', params.id).order('created_at', { ascending: false }),
  ])

  const colors = statusColor(job.status)
  const customer = job.customer as any
  const assignee = job.assignee as any
  const project = job.project as any
  const isOwner = profile?.role === 'owner'
  const location = [job.address_line1, job.city, job.state, job.zip].filter(Boolean).join(', ')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/jobs" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
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
        <JobActions jobId={params.id} status={job.status} isOwner={isOwner} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule & Location */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Schedule & Location</h2>
            <div className="grid grid-cols-2 gap-4">
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
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Open in Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
            {job.instructions && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Crew Instructions</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.instructions}</p>
              </div>
            )}
            {job.completion_notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Completion Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.completion_notes}</p>
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Camera className="w-4 h-4" /> Photos ({photos?.length ?? 0})
              </h2>
              <Button size="sm" variant="outline">Upload Photos</Button>
            </div>
            {!photos || photos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No photos yet — upload before/after photos</p>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {photos.map((p: any) => (
                  <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                    <img src={p.thumbnail_url ?? p.public_url} alt={p.caption ?? ''} className="w-full h-full object-cover" />
                    {(p.is_before || p.is_after) && (
                      <span className={`absolute top-1 left-1 text-xs font-bold px-1.5 py-0.5 rounded ${p.is_before ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                        {p.is_before ? 'Before' : 'After'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Documents ({files?.length ?? 0})
              </h2>
              <Button size="sm" variant="outline">Upload File</Button>
            </div>
            {!files || files.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No documents uploaded</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {files.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{f.original_name ?? f.name}</p>
                        <p className="text-xs text-gray-500">{formatDate(f.created_at, { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                    {f.public_url && (
                      <a href={f.public_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Expenses ({expenses?.length ?? 0})
              </h2>
              <Button size="sm" variant="outline">Add Expense</Button>
            </div>
            {!expenses || expenses.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No expenses tracked</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {expenses.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{e.title}</p>
                      <p className="text-xs text-gray-500 capitalize">{e.category?.replace(/_/g, ' ')} {e.vendor_name ? `— ${e.vendor_name}` : ''}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(e.total_amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 text-sm font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(expenses.reduce((s: number, e: any) => s + (e.total_amount ?? 0), 0))}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Customer</h2>
            {customer ? (
              <div className="space-y-2">
                <Link href={`/customers/${customer.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                  {customer.company_name ?? `${customer.first_name} ${customer.last_name}`}
                </Link>
                {customer.phone && (
                  <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {formatPhone(customer.phone)}
                  </a>
                )}
                {customer.email && (
                  <p className="text-sm text-gray-500">{customer.email}</p>
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
                  <p className="text-sm font-medium text-gray-900">{assignee.first_name} {assignee.last_name}</p>
                  {assignee.phone && (
                    <a href={`tel:${assignee.phone}`} className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {formatPhone(assignee.phone)}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Unassigned</p>
            )}
          </div>

          {/* Tags */}
          {job.tags?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Tags</h2>
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Timeline</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">{formatDate(job.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              {job.actual_start && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Started</span>
                  <span className="text-gray-900">{formatDate(job.actual_start, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              )}
              {job.actual_end && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed</span>
                  <span className="text-gray-900">{formatDate(job.actual_end, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
