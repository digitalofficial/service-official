import { createServiceRoleClient } from '@service-official/database'
import { formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Service Official' }

export default async function AdminPage() {
  const supabase = createServiceRoleClient()

  const [orgs, profiles, invoices] = await Promise.all([
    supabase.from('organizations').select('id, name, subscription_tier, subscription_status, created_at').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, organization_id', { count: 'exact', head: true }),
    supabase.from('invoices').select('total, amount_paid, organization_id'),
  ])

  const totalOrgs = orgs.data?.length ?? 0
  const activeOrgs = orgs.data?.filter(o => o.subscription_status === 'active' || o.subscription_status === 'trialing').length ?? 0
  const totalUsers = profiles.count ?? 0
  const totalRevenue = invoices.data?.reduce((sum, i) => sum + (i.amount_paid ?? 0), 0) ?? 0

  const tierCounts = orgs.data?.reduce((acc, o) => {
    acc[o.subscription_tier] = (acc[o.subscription_tier] ?? 0) + 1
    return acc
  }, {} as Record<string, number>) ?? {}

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Overview</h1>
        <p className="text-gray-400 text-sm mt-1">All organizations across Service Official</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard label="Total Clients" value={String(totalOrgs)} />
        <MetricCard label="Active" value={String(activeOrgs)} color="green" />
        <MetricCard label="Total Users" value={String(totalUsers)} />
        <MetricCard label="Total Revenue" value={formatCurrency(totalRevenue)} color="blue" />
      </div>

      {/* Tier Breakdown */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="font-semibold text-white mb-4">Plans</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {['solo', 'team', 'growth', 'enterprise'].map(tier => (
            <div key={tier} className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{tierCounts[tier] ?? 0}</p>
              <p className="text-xs text-gray-400 capitalize mt-1">{tier}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Clients */}
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">Recent Clients</h2>
          <a href="/admin/clients" className="text-sm text-blue-400 hover:underline">View all</a>
        </div>
        <div className="divide-y divide-gray-800">
          {orgs.data?.slice(0, 8).map(org => (
            <div key={org.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-white">{org.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(org.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs capitalize text-gray-400">{org.subscription_tier}</span>
                <StatusDot status={org.subscription_status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, color = 'default' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 sm:p-5">
      <p className="text-xl sm:text-3xl font-bold text-white truncate">{value}</p>
      <p className={`text-xs sm:text-sm mt-1 truncate ${color === 'green' ? 'text-green-400' : color === 'blue' ? 'text-blue-400' : 'text-gray-400'}`}>
        {label}
      </p>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-500',
    trialing: 'bg-blue-500',
    past_due: 'bg-amber-500',
    canceled: 'bg-red-500',
    paused: 'bg-gray-500',
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400 capitalize">
      <span className={`w-1.5 h-1.5 rounded-full ${colors[status] ?? 'bg-gray-500'}`} />
      {status.replace('_', ' ')}
    </span>
  )
}
