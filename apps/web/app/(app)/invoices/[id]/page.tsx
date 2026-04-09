import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@service-official/database'
import { InvoiceTemplate } from '@/components/invoices/invoice-template'
import { InvoiceActions } from './invoice-actions'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  ArrowLeft, FileText, Send, Eye, CreditCard, Clock,
  CheckCircle2, AlertCircle, RefreshCw, Receipt, Undo2
} from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Invoice Detail' }

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(*),
      line_items:invoice_line_items(*)
    `)
    .eq('id', params.id)
    .single()

  if (!invoice) notFound()

  // Fetch related data for activity timeline
  const [{ data: estimate }, { data: payments }] = await Promise.all([
    invoice.estimate_id
      ? supabase.from('estimates').select('id, estimate_number, status, approved_at, signed_at, created_at').eq('id', invoice.estimate_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('payments').select('id, amount, method, status, created_at').eq('invoice_id', params.id).order('created_at', { ascending: true }),
  ])

  // Build activity timeline
  const activities: { date: string; icon: any; iconColor: string; iconBg: string; title: string; detail?: string }[] = []

  if (estimate) {
    activities.push({
      date: estimate.created_at,
      icon: FileText,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      title: 'Estimate created',
      detail: estimate.estimate_number,
    })
    if (estimate.approved_at) {
      activities.push({
        date: estimate.approved_at,
        icon: CheckCircle2,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-50',
        title: 'Estimate approved by customer',
        detail: estimate.signed_at ? 'Signed digitally' : undefined,
      })
    }
  }

  activities.push({
    date: invoice.created_at,
    icon: Receipt,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    title: estimate ? 'Invoice created from estimate' : 'Invoice created',
    detail: `${invoice.invoice_number} — ${formatCurrency(invoice.total)}`,
  })

  if (invoice.status !== 'draft') {
    // Approximate sent date — use created_at + small offset if no explicit field
    const sentDate = invoice.updated_at && invoice.updated_at !== invoice.created_at ? invoice.updated_at : invoice.created_at
    if (['sent', 'viewed', 'partial', 'paid', 'overdue'].includes(invoice.status)) {
      activities.push({
        date: sentDate,
        icon: Send,
        iconColor: 'text-sky-600',
        iconBg: 'bg-sky-50',
        title: 'Invoice sent to customer',
        detail: (invoice as any).customer?.email || undefined,
      })
    }
  }

  if (invoice.viewed_at) {
    activities.push({
      date: invoice.viewed_at,
      icon: Eye,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      title: 'Customer viewed invoice',
      detail: invoice.view_count > 1 ? `Viewed ${invoice.view_count} times` : undefined,
    })
  }

  if (invoice.reminder_sent_at) {
    activities.push({
      date: invoice.reminder_sent_at,
      icon: RefreshCw,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      title: 'Payment reminder sent',
    })
  }

  for (const payment of (payments || [])) {
    if (payment.status === 'succeeded' || payment.status === 'pending') {
      activities.push({
        date: payment.created_at,
        icon: CreditCard,
        iconColor: payment.status === 'succeeded' ? 'text-emerald-600' : 'text-amber-600',
        iconBg: payment.status === 'succeeded' ? 'bg-emerald-50' : 'bg-amber-50',
        title: payment.status === 'succeeded' ? 'Payment received' : 'Payment pending',
        detail: `${formatCurrency(payment.amount)}${payment.method ? ` via ${payment.method}` : ''}`,
      })
    }
    if (payment.status === 'refunded') {
      activities.push({
        date: payment.created_at,
        icon: Undo2,
        iconColor: 'text-red-600',
        iconBg: 'bg-red-50',
        title: 'Payment refunded',
        detail: formatCurrency(payment.amount),
      })
    }
  }

  if (invoice.paid_at) {
    activities.push({
      date: invoice.paid_at,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      title: 'Invoice paid in full',
      detail: formatCurrency(invoice.total),
    })
  }

  if (invoice.status === 'overdue') {
    activities.push({
      date: invoice.due_date || invoice.updated_at,
      icon: AlertCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
      title: 'Invoice overdue',
      detail: invoice.due_date ? `Due date was ${formatDate(invoice.due_date)}` : undefined,
    })
  }

  if (invoice.status === 'voided') {
    activities.push({
      date: invoice.updated_at,
      icon: AlertCircle,
      iconColor: 'text-gray-500',
      iconBg: 'bg-gray-50',
      title: 'Invoice voided',
    })
  }

  // Sort chronologically
  activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const organization = (profile as any)?.organization
  const customer = (invoice as any)?.customer
  const lineItems = (invoice as any)?.line_items ?? []

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Link href="/invoices" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{invoice.invoice_number}</h1>
            <p className="text-sm text-gray-500">{invoice.title}</p>
          </div>
        </div>
        <InvoiceActions
          invoiceId={params.id}
          status={invoice.status}
          hasEmail={!!customer?.email}
          hasPhone={!!customer?.phone}
        />
      </div>

      {/* Invoice Preview */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <InvoiceTemplate
          invoice={invoice}
          organization={organization}
          customer={customer}
          lineItems={lineItems}
        />
      </div>

      {/* Activity Timeline */}
      {activities.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 no-print">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Activity</h2>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-3 bottom-3 w-px bg-gray-200" />

            <div className="space-y-4">
              {activities.map((activity, i) => {
                const Icon = activity.icon
                return (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className={`w-8 h-8 rounded-full ${activity.iconBg} flex items-center justify-center shrink-0 z-10`}>
                      <Icon className={`w-4 h-4 ${activity.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      {activity.detail && <p className="text-xs text-gray-500 mt-0.5">{activity.detail}</p>}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 pt-1.5">
                      {formatDate(activity.date)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
