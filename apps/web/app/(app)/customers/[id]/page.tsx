import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProfile } from '@/lib/auth/get-profile'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatPhone, statusColor } from '@/lib/utils'
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, User,
  FolderKanban, Receipt, FileText, Briefcase, MessageSquare,
  Edit, DollarSign, ExternalLink, Clock, StickyNote, Activity,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Customer Detail' }

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  try {
  const { supabase } = await getProfile()

  const { data: customer, error } = await supabase
    .from('customers')
    .select(`
      *,
      projects(id, name, status, contract_value, created_at),
      invoices(id, invoice_number, total, amount_due, status, due_date, created_at),
      estimates(id, estimate_number, total, status, created_at),
      jobs(id, job_number, title, status, priority, scheduled_start, assigned_to),
      conversations(id, channel, last_message_at)
    `)
    .eq('id', params.id)
    .single()

  if (error || !customer) notFound()

  const projects = (customer as any).projects ?? []
  const invoices = (customer as any).invoices ?? []
  const estimates = (customer as any).estimates ?? []
  const jobs = (customer as any).jobs ?? []
  const conversations = (customer as any).conversations ?? []

  const address = [customer.address_line1, customer.city, customer.state, customer.zip].filter(Boolean).join(', ')
  const mapQuery = encodeURIComponent(address)

  // Build activity timeline from all related data
  const activities: { date: string; icon: string; text: string; color: string }[] = []

  for (const job of jobs) {
    activities.push({
      date: job.scheduled_start ?? '',
      icon: 'job',
      text: `Job ${job.job_number}: ${job.title}`,
      color: 'blue',
    })
  }
  for (const est of estimates) {
    activities.push({
      date: est.created_at,
      icon: 'estimate',
      text: `Estimate ${est.estimate_number}: ${formatCurrency(est.total ?? 0)} — ${est.status}`,
      color: 'amber',
    })
  }
  for (const inv of invoices) {
    activities.push({
      date: inv.created_at,
      icon: 'invoice',
      text: `Invoice ${inv.invoice_number}: ${formatCurrency(inv.total ?? 0)} — ${inv.status}`,
      color: inv.status === 'paid' ? 'green' : inv.status === 'overdue' ? 'red' : 'gray',
    })
  }

  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const PRIORITY_COLORS: Record<string, string> = {
    urgent: 'bg-red-500', high: 'bg-orange-500', normal: 'bg-blue-500', low: 'bg-gray-400',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/customers" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {customer.company_name ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {customer.company_name ?? `${customer.first_name} ${customer.last_name}`}
              </h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                  {customer.type?.replace('_', ' ')}
                </span>
                {customer.source && <Badge variant="secondary">{customer.source}</Badge>}
                {customer.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/customers/${customer.id}/edit`}>
            <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-1" /> Edit</Button>
          </Link>
          <Link href={`/jobs/new?customer_id=${customer.id}`}>
            <Button variant="outline" size="sm"><Briefcase className="w-4 h-4 mr-1" /> New Job</Button>
          </Link>
          <Link href={`/projects/new?customer_id=${customer.id}`}>
            <Button size="sm"><FolderKanban className="w-4 h-4 mr-1" /> New Project</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDEBAR */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-blue-600">
                  <Mail className="w-4 h-4 text-gray-400" /> {customer.email}
                </a>
              )}
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-blue-600">
                  <Phone className="w-4 h-4 text-gray-400" /> {formatPhone(customer.phone)}
                </a>
              )}
              {address && (
                <div className="flex items-start gap-2.5 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p>{customer.address_line1}</p>
                    {customer.address_line2 && <p>{customer.address_line2}</p>}
                    <p>{[customer.city, customer.state, customer.zip].filter(Boolean).join(', ')}</p>
                    <a
                      href={`https://maps.google.com/?q=${mapQuery}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Open in Google Maps
                    </a>
                  </div>
                </div>
              )}
              {customer.company_name && (customer.first_name || customer.last_name) && (
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  {customer.first_name} {customer.last_name}
                </div>
              )}
            </div>

            {/* Revenue Summary */}
            <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(customer.total_revenue ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Outstanding</p>
                <p className={`text-lg font-bold ${(customer.outstanding_balance ?? 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatCurrency(customer.outstanding_balance ?? 0)}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900">{jobs.length}</p>
                <p className="text-xs text-gray-500">Jobs</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{estimates.length}</p>
                <p className="text-xs text-gray-500">Estimates</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{invoices.length}</p>
                <p className="text-xs text-gray-500">Invoices</p>
              </div>
            </div>
          </div>

          {/* Map */}
          {address && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <iframe
                width="100%"
                height="200"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              />
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <StickyNote className="w-4 h-4" /> Notes
            </h2>
            {customer.notes ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
            ) : (
              <p className="text-sm text-gray-400">No notes yet — add them via Edit</p>
            )}
          </div>
        </div>

        {/* RIGHT: Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Jobs */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Jobs ({jobs.length})
              </h2>
              <Link href={`/jobs/new?customer_id=${customer.id}`} className="text-xs text-blue-600 hover:underline">
                + New Job
              </Link>
            </div>
            {jobs.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No jobs yet</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {jobs.map((job: any) => {
                  const colors = statusColor(job.status)
                  return (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="flex items-center justify-between py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[job.priority] ?? 'bg-gray-400'}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{job.job_number}: {job.title}</p>
                          {job.scheduled_start && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(job.scheduled_start, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors.bg} ${colors.text}`}>
                        {job.status.replace(/_/g, ' ')}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Estimates */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Estimates ({estimates.length})
              </h2>
              <Link href={`/estimates/new?customer_id=${customer.id}`} className="text-xs text-blue-600 hover:underline">
                + New Estimate
              </Link>
            </div>
            {estimates.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No estimates yet</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {estimates.map((est: any) => {
                  const colors = statusColor(est.status)
                  return (
                    <Link
                      key={est.id}
                      href={`/estimates/${est.id}`}
                      className="flex items-center justify-between py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{est.estimate_number}</p>
                        <p className="text-xs text-gray-500">{formatDate(est.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">{formatCurrency(est.total ?? 0)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors.bg} ${colors.text}`}>
                          {est.status}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Projects */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FolderKanban className="w-4 h-4" /> Projects ({projects.length})
              </h2>
              <Link href={`/projects/new?customer_id=${customer.id}`} className="text-xs text-blue-600 hover:underline">
                + New
              </Link>
            </div>
            {projects.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No projects yet</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {projects.map((p: any) => {
                  const colors = statusColor(p.status)
                  return (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="flex items-center justify-between py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{formatDate(p.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {p.contract_value && (
                          <span className="text-sm font-medium text-gray-700">{formatCurrency(p.contract_value)}</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                          {p.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Invoices */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="w-4 h-4" /> Invoices ({invoices.length})
              </h2>
              <Link href={`/invoices/new?customer_id=${customer.id}`} className="text-xs text-blue-600 hover:underline">
                + New Invoice
              </Link>
            </div>
            {invoices.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No invoices yet</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {invoices.map((inv: any) => {
                  const colors = statusColor(inv.status)
                  return (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{inv.invoice_number}</p>
                        {inv.due_date && <p className="text-xs text-gray-500">Due {formatDate(inv.due_date)}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">{formatCurrency(inv.total)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.bg} ${colors.text}`}>
                          {inv.status}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Activity
            </h2>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 20).map((act, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      act.color === 'blue' ? 'bg-blue-500' :
                      act.color === 'amber' ? 'bg-amber-500' :
                      act.color === 'green' ? 'bg-green-500' :
                      act.color === 'red' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{act.text}</p>
                      {act.date && (
                        <p className="text-xs text-gray-400">
                          {formatDate(act.date, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
  } catch (err: any) {
    console.error('CUSTOMER PAGE ERROR:', err.message, err.stack)
    return (
      <div className="p-8 text-center">
        <h1 className="text-lg font-bold text-red-600">Something went wrong</h1>
        <p className="text-sm text-gray-500 mt-2">{err.message}</p>
      </div>
    )
  }
}
