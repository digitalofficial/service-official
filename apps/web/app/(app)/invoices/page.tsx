import Link from 'next/link'
import { createServerSupabaseClient } from '@service-official/database'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatDate, statusColor } from '@/lib/utils'
import { Plus, Receipt, Eye, ChevronRight, AlertCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Invoices' }

interface Props {
  searchParams: { status?: string }
}

const STATUS_TABS = [
  { label: 'All', value: undefined },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Partial', value: 'partial' },
  { label: 'Paid', value: 'paid' },
  { label: 'Overdue', value: 'overdue' },
]

export default async function InvoicesPage({ searchParams }: Props) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()

  let query = supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(id, first_name, last_name, company_name, email),
      project:projects(id, name)
    `)
    .eq('organization_id', profile!.organization_id)
    .order('created_at', { ascending: false })

  if (searchParams.status) query = query.eq('status', searchParams.status)

  const { data: invoices } = await query

  // Summary stats
  const outstanding = (invoices ?? []).filter((i: any) => ['sent', 'partial', 'overdue'].includes(i.status)).reduce((sum: number, i: any) => sum + (i.amount_due ?? 0), 0)
  const overdue = (invoices ?? []).filter((i: any) => i.status === 'overdue').reduce((sum: number, i: any) => sum + (i.amount_due ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description={`${invoices?.length ?? 0} total invoices`}
        actions={
          <Link href="/invoices/new">
            <Button><Plus className="w-4 h-4 mr-2" />New Invoice</Button>
          </Link>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Outstanding</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(outstanding)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 flex items-center gap-1">Overdue <AlertCircle className="w-3 h-3 text-red-500" /></p>
          <p className={`text-xl font-bold mt-1 ${overdue > 0 ? 'text-red-600' : 'text-gray-900'}`}>{formatCurrency(overdue)}</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/invoices?status=${tab.value}` : '/invoices'}
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

      {!invoices || invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-12 h-12" />}
          title="No invoices yet"
          description="Create your first invoice to start getting paid."
          action={
            <Link href="/invoices/new">
              <Button><Plus className="w-4 h-4 mr-2" />Create Invoice</Button>
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left font-medium text-gray-500 px-4 py-3">Invoice</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Customer</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Project</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Date</th>
                <th className="text-right font-medium text-gray-500 px-4 py-3">Total</th>
                <th className="text-right font-medium text-gray-500 px-4 py-3">Due</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Status</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv: any) => {
                const colors = statusColor(inv.status)
                const isOverdue = inv.status === 'overdue' || (inv.due_date && new Date(inv.due_date) < new Date() && !['paid', 'voided'].includes(inv.status))
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/invoices/${inv.id}`} className="group">
                        <p className="font-medium text-gray-900 group-hover:text-blue-600">{inv.invoice_number}</p>
                        {inv.title && <p className="text-xs text-gray-500 truncate max-w-[180px]">{inv.title}</p>}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {inv.customer
                        ? (inv.customer.company_name ?? `${inv.customer.first_name} ${inv.customer.last_name}`)
                        : <span className="text-gray-400">--</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {inv.project?.name ?? <span className="text-gray-400">--</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(inv.issue_date)}
                      {inv.due_date && (
                        <span className={`block ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                          Due {formatDate(inv.due_date)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={inv.amount_due > 0 ? 'font-medium text-gray-900' : 'text-gray-400'}>
                        {formatCurrency(inv.amount_due)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors.bg} ${colors.text}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/invoices/${inv.id}`}>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
