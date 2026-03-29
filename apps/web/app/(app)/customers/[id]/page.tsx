import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@service-official/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatPhone, statusColor } from '@/lib/utils'
import {
  ArrowLeft, Mail, Phone, MapPin, Building2, User,
  FolderKanban, Receipt, MessageSquare, Edit, DollarSign
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Customer Detail' }

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: customer, error } = await supabase
    .from('customers')
    .select(`
      *,
      projects(id, name, status, contract_value, created_at),
      invoices(id, invoice_number, total, amount_due, status, due_date),
      conversations(id, channel, last_message_at)
    `)
    .eq('id', params.id)
    .single()

  if (error || !customer) notFound()

  const projects = (customer as any).projects ?? []
  const invoices = (customer as any).invoices ?? []
  const conversations = (customer as any).conversations ?? []

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
          <Link href={`/projects/new?customer_id=${customer.id}`}>
            <Button size="sm"><FolderKanban className="w-4 h-4 mr-1" /> New Project</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            {customer.address_line1 && (
              <div className="flex items-start gap-2.5 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p>{customer.address_line1}</p>
                  {customer.address_line2 && <p>{customer.address_line2}</p>}
                  <p>{customer.city}, {customer.state} {customer.zip}</p>
                </div>
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

          {customer.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Projects & Invoices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Projects ({projects.length})</h2>
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
              <h2 className="text-sm font-semibold text-gray-900">Invoices ({invoices.length})</h2>
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
        </div>
      </div>
    </div>
  )
}
