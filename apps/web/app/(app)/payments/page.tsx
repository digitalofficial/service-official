import { getProfile } from '@/lib/auth/get-profile'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatDate, statusColor } from '@/lib/utils'
import { CreditCard, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react'
import { ExportButton } from '@/components/ui/export-button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Payments' }

interface Props {
  searchParams: { status?: string }
}

export default async function PaymentsPage({ searchParams }: Props) {
  const { supabase, profile } = await getProfile()

  let query = supabase
    .from('payments')
    .select(`
      *,
      invoice:invoices(id, invoice_number, total),
      customer:customers(id, first_name, last_name, company_name)
    `)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (searchParams.status) query = query.eq('status', searchParams.status)

  const { data: payments } = await query

  const totalReceived = (payments ?? []).filter((p: any) => p.status === 'succeeded').reduce((sum: number, p: any) => sum + p.amount, 0)
  const totalPending = (payments ?? []).filter((p: any) => p.status === 'pending').reduce((sum: number, p: any) => sum + p.amount, 0)

  const METHOD_ICONS: Record<string, string> = {
    card: 'Card',
    ach: 'ACH',
    check: 'Check',
    cash: 'Cash',
    zelle: 'Zelle',
    venmo: 'Venmo',
  }

  const STATUS_ICON = {
    succeeded: <CheckCircle className="w-3.5 h-3.5 text-green-600" />,
    pending: <Clock className="w-3.5 h-3.5 text-amber-600" />,
    processing: <Clock className="w-3.5 h-3.5 text-blue-600" />,
    failed: <XCircle className="w-3.5 h-3.5 text-red-600" />,
    refunded: <XCircle className="w-3.5 h-3.5 text-gray-500" />,
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description={`${payments?.length ?? 0} total payments`} actions={<ExportButton entity="payments" />} />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Received</p>
          <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {!payments || payments.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-12 h-12" />}
          title="No payments yet"
          description="Payments will appear here once invoices are paid."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left font-medium text-gray-500 px-4 py-3">Date</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Customer</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Invoice</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Method</th>
                <th className="text-right font-medium text-gray-500 px-4 py-3">Amount</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {formatDate(p.created_at)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {p.customer
                      ? (p.customer.company_name ?? `${p.customer.first_name} ${p.customer.last_name}`)
                      : <span className="text-gray-400">--</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.invoice?.invoice_number ?? <span className="text-gray-400">--</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                      {METHOD_ICONS[p.method] ?? p.method ?? '--'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 capitalize text-xs font-medium">
                      {STATUS_ICON[p.status as keyof typeof STATUS_ICON]}
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
