import Link from 'next/link'
import { getProfile } from '@/lib/auth/get-profile'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatDate, statusColor } from '@/lib/utils'
import { Plus, FileText, Eye, Send, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Estimates' }

interface Props {
  searchParams: { status?: string }
}

const STATUS_TABS = [
  { label: 'All', value: undefined },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Viewed', value: 'viewed' },
  { label: 'Approved', value: 'approved' },
  { label: 'Declined', value: 'declined' },
  { label: 'Expired', value: 'expired' },
]

export default async function EstimatesPage({ searchParams }: Props) {
  const { supabase, profile } = await getProfile()

  let query = supabase
    .from('estimates')
    .select(`
      *,
      customer:customers(id, first_name, last_name, company_name),
      project:projects(id, name)
    `)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (searchParams.status) query = query.eq('status', searchParams.status)

  const { data: estimates } = await query

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estimates"
        description={`${estimates?.length ?? 0} total estimates`}
        actions={
          <Link href="/estimates/new">
            <Button><Plus className="w-4 h-4 mr-2" />New Estimate</Button>
          </Link>
        }
      />

      {/* Status Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto scroll-fade">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/estimates?status=${tab.value}` : '/estimates'}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors shrink-0 whitespace-nowrap ${
              searchParams.status === tab.value || (!searchParams.status && !tab.value)
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {!estimates || estimates.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="No estimates yet"
          description="Create your first estimate to start winning jobs."
          action={
            <Link href="/estimates/new">
              <Button><Plus className="w-4 h-4 mr-2" />Create Estimate</Button>
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left font-medium text-gray-500 px-4 py-3">Estimate</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Customer</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Project</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Date</th>
                <th className="text-right font-medium text-gray-500 px-4 py-3">Total</th>
                <th className="text-left font-medium text-gray-500 px-4 py-3">Status</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {estimates.map((est: any) => {
                const colors = statusColor(est.status)
                return (
                  <tr key={est.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/estimates/${est.id}`} className="group">
                        <p className="font-medium text-gray-900 group-hover:text-blue-600">{est.estimate_number}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{est.title}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {est.customer
                        ? (est.customer.company_name ?? `${est.customer.first_name} ${est.customer.last_name}`)
                        : <span className="text-gray-400">--</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {est.project?.name ?? <span className="text-gray-400">--</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(est.issue_date)}
                      {est.expiry_date && (
                        <span className="block text-gray-400">Expires {formatDate(est.expiry_date)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(est.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors.bg} ${colors.text}`}>
                        {est.status}
                      </span>
                      {est.view_count > 0 && (
                        <span className="ml-1.5 text-xs text-gray-400 inline-flex items-center gap-0.5">
                          <Eye className="w-3 h-3" />{est.view_count}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/estimates/${est.id}`}>
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
