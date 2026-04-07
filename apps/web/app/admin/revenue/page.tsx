import { createServiceRoleClient } from '@service-official/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Revenue — Admin' }

export default async function AdminRevenuePage() {
  const supabase = createServiceRoleClient()

  // All invoices across all orgs
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, organization_id, total, amount_paid, amount_due, status, issue_date')
    .order('issue_date', { ascending: false })

  // All orgs for name lookup
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')

  const orgMap = new Map((orgs ?? []).map(o => [o.id, o.name]))

  const totalRevenue = (invoices ?? []).reduce((sum, i) => sum + (i.amount_paid ?? 0), 0)
  const totalOutstanding = (invoices ?? []).filter(i => ['sent', 'partial', 'overdue', 'viewed'].includes(i.status)).reduce((sum, i) => sum + (i.amount_due ?? 0), 0)
  const totalInvoiced = (invoices ?? []).reduce((sum, i) => sum + (i.total ?? 0), 0)
  const paidCount = (invoices ?? []).filter(i => i.status === 'paid').length

  // Revenue by org
  const revenueByOrg: Record<string, { name: string; paid: number; outstanding: number; count: number }> = {}
  for (const inv of (invoices ?? [])) {
    const key = inv.organization_id
    if (!revenueByOrg[key]) {
      revenueByOrg[key] = { name: orgMap.get(key) ?? 'Unknown', paid: 0, outstanding: 0, count: 0 }
    }
    revenueByOrg[key].paid += inv.amount_paid ?? 0
    revenueByOrg[key].outstanding += inv.amount_due ?? 0
    revenueByOrg[key].count++
  }

  const orgRevenue = Object.values(revenueByOrg).sort((a, b) => b.paid - a.paid)

  // Monthly revenue (last 12 months)
  const now = new Date()
  const monthly: { month: string; revenue: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const rev = (invoices ?? []).filter(inv => inv.issue_date?.startsWith(key)).reduce((sum, inv) => sum + (inv.amount_paid ?? 0), 0)
    monthly.push({ month: label, revenue: rev })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Revenue</h1>
        <p className="text-gray-400 text-sm mt-1">Platform-wide financial overview</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard label="Total Collected" value={formatCurrency(totalRevenue)} color="green" />
        <MetricCard label="Total Invoiced" value={formatCurrency(totalInvoiced)} />
        <MetricCard label="Outstanding" value={formatCurrency(totalOutstanding)} color="amber" />
        <MetricCard label="Invoices Paid" value={String(paidCount)} color="blue" />
      </div>

      {/* Monthly Revenue */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 sm:p-6">
        <h2 className="font-semibold text-white mb-4">Monthly Revenue (All Clients)</h2>
        <div className="flex items-end gap-1 sm:gap-2 h-36 sm:h-48 overflow-hidden">
          {monthly.map((m) => {
            const maxRev = Math.max(...monthly.map(x => x.revenue), 1)
            const height = Math.max((m.revenue / maxRev) * 100, 2)
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] sm:text-xs text-gray-500 hidden sm:block">{m.revenue > 0 ? formatCurrency(m.revenue) : ''}</span>
                <div className="w-full bg-blue-600 rounded-t" style={{ height: `${height}%` }} />
                <span className="text-[9px] sm:text-xs text-gray-500 truncate">{m.month}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Revenue by Client */}
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">Revenue by Client</h2>
        </div>
        {orgRevenue.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No invoice data yet</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {orgRevenue.map((org) => (
              <div key={org.name} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-white">{org.name}</p>
                  <p className="text-xs text-gray-500">{org.count} invoice{org.count !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-green-400 font-medium">{formatCurrency(org.paid)}</p>
                    <p className="text-xs text-gray-500">collected</p>
                  </div>
                  {org.outstanding > 0 && (
                    <div className="text-right">
                      <p className="text-amber-400 font-medium">{formatCurrency(org.outstanding)}</p>
                      <p className="text-xs text-gray-500">outstanding</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Invoices */}
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">Recent Invoices (All Clients)</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {(invoices ?? []).slice(0, 15).map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm text-white">{orgMap.get(inv.organization_id) ?? 'Unknown'}</p>
                <p className="text-xs text-gray-500">{formatDate(inv.issue_date)}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-white">{formatCurrency(inv.total)}</span>
                <StatusBadge status={inv.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, color = 'default' }: { label: string; value: string; color?: string }) {
  const colors: Record<string, string> = { green: 'text-green-400', amber: 'text-amber-400', blue: 'text-blue-400', default: 'text-gray-400' }
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 sm:p-5">
      <p className="text-xl sm:text-3xl font-bold text-white truncate">{value}</p>
      <p className={`text-xs sm:text-sm mt-1 truncate ${colors[color] ?? colors.default}`}>{label}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: 'bg-green-500/20 text-green-400',
    sent: 'bg-blue-500/20 text-blue-400',
    viewed: 'bg-sky-500/20 text-sky-400',
    partial: 'bg-amber-500/20 text-amber-400',
    overdue: 'bg-red-500/20 text-red-400',
    draft: 'bg-gray-700 text-gray-400',
    voided: 'bg-gray-700 text-gray-500',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${map[status] ?? 'bg-gray-700 text-gray-400'}`}>
      {status}
    </span>
  )
}
