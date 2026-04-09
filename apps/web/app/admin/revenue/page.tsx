import { createServiceRoleClient } from '@service-official/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Estimates — Admin' }

export default async function AdminEstimatesPage() {
  const supabase = createServiceRoleClient()

  // All estimates across all orgs
  const { data: estimates } = await supabase
    .from('estimates')
    .select('id, organization_id, estimate_number, title, status, total, issue_date, approved_at, customer:customers(first_name, last_name, company_name)')
    .order('created_at', { ascending: false })

  // All orgs for name lookup
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')

  const orgMap = new Map((orgs ?? []).map(o => [o.id, o.name]))

  const all = estimates ?? []
  const pending = all.filter(e => ['sent', 'viewed'].includes(e.status))
  const approved = all.filter(e => e.status === 'approved')
  const declined = all.filter(e => e.status === 'declined')
  const converted = all.filter(e => e.status === 'converted')
  const drafts = all.filter(e => e.status === 'draft')

  const pendingValue = pending.reduce((sum, e) => sum + (e.total ?? 0), 0)
  const approvedValue = approved.reduce((sum, e) => sum + (e.total ?? 0), 0)
  const convertedValue = converted.reduce((sum, e) => sum + (e.total ?? 0), 0)
  const totalValue = all.reduce((sum, e) => sum + (e.total ?? 0), 0)

  // Estimates by org
  const byOrg: Record<string, { name: string; pending: number; approved: number; total: number; count: number }> = {}
  for (const est of all) {
    const key = est.organization_id
    if (!byOrg[key]) {
      byOrg[key] = { name: orgMap.get(key) ?? 'Unknown', pending: 0, approved: 0, total: 0, count: 0 }
    }
    byOrg[key].total += est.total ?? 0
    byOrg[key].count++
    if (['sent', 'viewed'].includes(est.status)) byOrg[key].pending += est.total ?? 0
    if (est.status === 'approved') byOrg[key].approved += est.total ?? 0
  }

  const orgEstimates = Object.values(byOrg).sort((a, b) => b.total - a.total)

  // Approval rate
  const decidedCount = approved.length + declined.length
  const approvalRate = decidedCount > 0 ? Math.round((approved.length / decidedCount) * 100) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Estimates</h1>
        <p className="text-gray-400 text-sm mt-1">Platform-wide estimate overview — pending, approved, and converted</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard label="Pending Approval" value={formatCurrency(pendingValue)} count={pending.length} color="amber" />
        <MetricCard label="Approved" value={formatCurrency(approvedValue)} count={approved.length} color="green" />
        <MetricCard label="Converted to Invoice" value={formatCurrency(convertedValue)} count={converted.length} color="blue" />
        <MetricCard label="Approval Rate" value={`${approvalRate}%`} count={decidedCount > 0 ? `${approved.length}/${decidedCount}` : '—'} color="purple" />
      </div>

      {/* Pipeline Summary */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 sm:p-6">
        <h2 className="font-semibold text-white mb-4">Estimate Pipeline</h2>
        <div className="flex items-center gap-2">
          {[
            { label: 'Drafts', count: drafts.length, color: 'bg-gray-600' },
            { label: 'Pending', count: pending.length, color: 'bg-amber-500' },
            { label: 'Approved', count: approved.length, color: 'bg-green-500' },
            { label: 'Converted', count: converted.length, color: 'bg-blue-500' },
            { label: 'Declined', count: declined.length, color: 'bg-red-500' },
          ].map(stage => {
            const width = all.length > 0 ? Math.max((stage.count / all.length) * 100, stage.count > 0 ? 3 : 0) : 0
            return (
              <div key={stage.label} className="flex-1" style={{ flex: `${Math.max(width, 1)}` }}>
                <div className={`${stage.color} h-8 rounded flex items-center justify-center`}>
                  {stage.count > 0 && <span className="text-white text-xs font-bold">{stage.count}</span>}
                </div>
                <p className="text-xs text-gray-500 text-center mt-1.5">{stage.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Estimates by Client */}
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">Estimates by Client</h2>
        </div>
        {orgEstimates.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No estimate data yet</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {orgEstimates.map((org) => (
              <div key={org.name} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-white">{org.name}</p>
                  <p className="text-xs text-gray-500">{org.count} estimate{org.count !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  {org.pending > 0 && (
                    <div className="text-right">
                      <p className="text-amber-400 font-medium">{formatCurrency(org.pending)}</p>
                      <p className="text-xs text-gray-500">pending</p>
                    </div>
                  )}
                  {org.approved > 0 && (
                    <div className="text-right">
                      <p className="text-green-400 font-medium">{formatCurrency(org.approved)}</p>
                      <p className="text-xs text-gray-500">approved</p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-gray-400 font-medium">{formatCurrency(org.total)}</p>
                    <p className="text-xs text-gray-500">total</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Estimates */}
      {pending.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">Pending Approval ({pending.length})</h2>
            <span className="text-amber-400 font-bold">{formatCurrency(pendingValue)}</span>
          </div>
          <div className="divide-y divide-gray-800">
            {pending.slice(0, 20).map((est) => {
              const customer = est.customer as any
              const customerName = customer?.company_name || `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim() || '—'
              return (
                <div key={est.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-white">{est.title || est.estimate_number}</p>
                    <p className="text-xs text-gray-500">{orgMap.get(est.organization_id) ?? 'Unknown'} — {customerName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-white">{formatCurrency(est.total)}</span>
                    <StatusBadge status={est.status} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recently Approved */}
      {approved.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">Recently Approved ({approved.length})</h2>
            <span className="text-green-400 font-bold">{formatCurrency(approvedValue)}</span>
          </div>
          <div className="divide-y divide-gray-800">
            {approved.slice(0, 15).map((est) => {
              const customer = est.customer as any
              const customerName = customer?.company_name || `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim() || '—'
              return (
                <div key={est.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-white">{est.title || est.estimate_number}</p>
                    <p className="text-xs text-gray-500">
                      {orgMap.get(est.organization_id) ?? 'Unknown'} — {customerName}
                      {est.approved_at && <span className="ml-2 text-green-500">Approved {formatDate(est.approved_at)}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-white">{formatCurrency(est.total)}</span>
                    <StatusBadge status={est.status} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, count, color = 'default' }: { label: string; value: string; count: number | string; color?: string }) {
  const colors: Record<string, string> = { green: 'text-green-400', amber: 'text-amber-400', blue: 'text-blue-400', purple: 'text-purple-400', default: 'text-gray-400' }
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 sm:p-5">
      <p className="text-xl sm:text-3xl font-bold text-white truncate">{value}</p>
      <p className={`text-xs sm:text-sm mt-1 truncate ${colors[color] ?? colors.default}`}>{label}</p>
      <p className="text-xs text-gray-600 mt-0.5">{count} estimate{typeof count === 'number' && count !== 1 ? 's' : ''}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: 'bg-green-500/20 text-green-400',
    sent: 'bg-amber-500/20 text-amber-400',
    viewed: 'bg-sky-500/20 text-sky-400',
    declined: 'bg-red-500/20 text-red-400',
    converted: 'bg-blue-500/20 text-blue-400',
    draft: 'bg-gray-700 text-gray-400',
    expired: 'bg-gray-700 text-gray-500',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${map[status] ?? 'bg-gray-700 text-gray-400'}`}>
      {status}
    </span>
  )
}
