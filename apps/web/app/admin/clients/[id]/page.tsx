import { createServiceRoleClient } from '@service-official/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { ClientActions } from './client-actions'
import { AddOwnerButton } from './add-owner-button'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServiceRoleClient()

  const { data: org } = await supabase
    .from('organizations')
    .select(`
      *,
      domains:organization_domains(*),
      profiles(id, first_name, last_name, email, role, is_active, created_at)
    `)
    .eq('id', params.id)
    .single()

  if (!org) notFound()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('total, amount_paid, status, created_at')
    .eq('organization_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, contract_value, created_at')
    .eq('organization_id', params.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const totalRevenue = invoices?.reduce((sum, i) => sum + (i.amount_paid ?? 0), 0) ?? 0
  const profiles = org.profiles as any[]
  const domains = org.domains as any[]
  const primaryDomain = domains?.[0]

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-xl font-bold text-white">
            {org.name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{org.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              {primaryDomain && (
                <a href={`https://${primaryDomain.domain}`} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline">
                  {primaryDomain.domain} →
                </a>
              )}
              <span className="text-xs capitalize text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                {org.subscription_tier}
              </span>
              <StatusBadge status={org.subscription_status} />
            </div>
          </div>
        </div>
        <ClientActions org={org} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} color="green" />
        <StatCard label="Team Members" value={String(profiles.length)} />
        <StatCard label="Projects" value={String(projects?.length ?? 0)} />
        <StatCard label="Invoices" value={String(invoices?.length ?? 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Team Members ({profiles.length})</h2>
            <AddOwnerButton orgId={params.id} />
          </div>
          <div className="space-y-2">
            {profiles.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                    {p.first_name?.[0]}{p.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm text-white">{p.first_name} {p.last_name}</p>
                    <p className="text-xs text-gray-500">{p.email}</p>
                  </div>
                </div>
                <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${p.role === 'owner' ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                  {p.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Recent Invoices</h2>
          {invoices?.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No invoices yet</p>
          ) : (
            <div className="space-y-2">
              {invoices?.map((inv, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm text-white">{formatCurrency(inv.total)}</p>
                    <p className="text-xs text-gray-500">{formatDate(inv.created_at)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${inv.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Org Details */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">Organization Details</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <Detail label="Industry" value={org.industry?.replace(/_/g, ' ')} />
          <Detail label="Created" value={formatDate(org.created_at)} />
          <Detail label="Trial Ends" value={org.trial_ends_at ? formatDate(org.trial_ends_at) : 'N/A'} />
          <Detail label="Timezone" value={org.timezone} />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'default' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className={`text-2xl font-bold ${color === 'green' ? 'text-green-400' : 'text-white'}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  )
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-white capitalize">{value ?? '—'}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    trialing: 'bg-blue-500/20 text-blue-400',
    past_due: 'bg-amber-500/20 text-amber-400',
    canceled: 'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${map[status] ?? 'bg-gray-700 text-gray-400'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
