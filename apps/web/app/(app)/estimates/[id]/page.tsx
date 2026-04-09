import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@service-official/database'
import { EstimateTemplate } from '@/components/estimates/estimate-template'
import { EstimateActions } from './estimate-actions'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  ArrowLeft, FileText, Send, Eye, CheckCircle2, XCircle,
  Clock, Receipt, Pen
} from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Estimate Detail' }

export default async function EstimateDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  const { data: estimate } = await supabase
    .from('estimates')
    .select(`
      *,
      customer:customers(*),
      line_items:estimate_line_items(*)
    `)
    .eq('id', params.id)
    .single()

  if (!estimate) notFound()

  // Fetch linked invoice if converted
  const { data: linkedInvoice } = estimate.status === 'converted'
    ? await supabase
        .from('invoices')
        .select('id, invoice_number, status, total, created_at')
        .eq('estimate_id', params.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    : { data: null }

  // Build activity timeline
  const activities: { date: string; icon: any; iconColor: string; iconBg: string; title: string; detail?: string }[] = []

  activities.push({
    date: estimate.created_at,
    icon: FileText,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    title: 'Estimate created',
    detail: `${estimate.estimate_number} — ${formatCurrency(estimate.total)}`,
  })

  // If status moved past draft, it was sent
  if (['sent', 'viewed', 'approved', 'declined', 'converted', 'expired'].includes(estimate.status)) {
    activities.push({
      date: estimate.updated_at || estimate.created_at,
      icon: Send,
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-50',
      title: 'Estimate sent to customer',
      detail: (estimate as any).customer?.email || undefined,
    })
  }

  if (estimate.view_count > 0) {
    activities.push({
      date: estimate.updated_at || estimate.created_at,
      icon: Eye,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      title: 'Customer viewed estimate',
      detail: estimate.view_count > 1 ? `Viewed ${estimate.view_count} times` : undefined,
    })
  }

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

  if (estimate.signed_at && estimate.signature_url) {
    activities.push({
      date: estimate.signed_at,
      icon: Pen,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      title: 'Customer signature captured',
    })
  }

  if (estimate.status === 'declined') {
    activities.push({
      date: estimate.updated_at || estimate.created_at,
      icon: XCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-50',
      title: 'Estimate declined by customer',
    })
  }

  if (estimate.status === 'converted' && linkedInvoice) {
    activities.push({
      date: linkedInvoice.created_at,
      icon: Receipt,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      title: 'Converted to invoice',
      detail: `${linkedInvoice.invoice_number} — ${formatCurrency(linkedInvoice.total)}`,
    })
  }

  if (estimate.status === 'expired') {
    activities.push({
      date: estimate.expiry_date || estimate.updated_at,
      icon: Clock,
      iconColor: 'text-gray-500',
      iconBg: 'bg-gray-50',
      title: 'Estimate expired',
      detail: estimate.expiry_date ? `Expiry date was ${formatDate(estimate.expiry_date)}` : undefined,
    })
  }

  // Sort chronologically
  activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const organization = (profile as any)?.organization
  const customer = (estimate as any)?.customer
  const lineItems = ((estimate as any)?.line_items ?? []).sort((a: any, b: any) => a.order_index - b.order_index)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Link href="/estimates" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{estimate.estimate_number}</h1>
            <p className="text-sm text-gray-500">{estimate.title}</p>
          </div>
        </div>
        <EstimateActions
          estimateId={params.id}
          status={estimate.status}
          hasEmail={!!customer?.email}
          hasPhone={!!customer?.phone}
        />
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <EstimateTemplate
          estimate={estimate}
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

          {/* Link to invoice if converted */}
          {linkedInvoice && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link href={`/invoices/${linkedInvoice.id}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1.5">
                <Receipt className="w-4 h-4" />
                View Invoice {linkedInvoice.invoice_number}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
