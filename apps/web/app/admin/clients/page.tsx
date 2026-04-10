import { createServiceRoleClient } from '@service-official/database'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Clients — Admin' }

export default async function AdminClientsPage() {
  const supabase = createServiceRoleClient()

  const { data: orgs } = await supabase
    .from('organizations')
    .select(`
      *,
      profiles(id)
    `)
    .order('created_at', { ascending: false })

  // Get last sign-in times from auth.users (profiles.id = auth.users.id)
  const lastSignInByOrg: Record<string, string | null> = {}
  try {
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (orgs && authData?.users) {
      const signInMap = new Map<string, string>()
      for (const u of authData.users) {
        if (u.last_sign_in_at) signInMap.set(u.id, u.last_sign_in_at)
      }
      for (const org of orgs) {
        const profileIds = (org.profiles as any[])?.map((p: any) => p.id) ?? []
        const signIns = profileIds
          .map((id: string) => signInMap.get(id))
          .filter(Boolean) as string[]
        lastSignInByOrg[org.id] = signIns.length
          ? signIns.sort().reverse()[0]
          : null
      }
    }
  } catch {
    // If auth admin API fails, last login will show as "—"
  }

  // Get revenue per org
  const { data: invoices } = await supabase
    .from('invoices')
    .select('organization_id, amount_paid')

  const revenueByOrg = invoices?.reduce((acc, inv) => {
    acc[inv.organization_id] = (acc[inv.organization_id] ?? 0) + (inv.amount_paid ?? 0)
    return acc
  }, {} as Record<string, number>) ?? {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Clients</h1>
          <p className="text-gray-400 text-sm mt-1">{orgs?.length ?? 0} total organizations</p>
        </div>
        <Link
          href="/admin/clients/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Client
        </Link>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-800">
              <th className="text-left px-5 py-3 font-medium">Company</th>
              <th className="text-left px-4 py-3 font-medium">Plan</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Users</th>
              <th className="text-left px-4 py-3 font-medium">Revenue</th>
              <th className="text-left px-4 py-3 font-medium">Joined</th>
              <th className="text-left px-4 py-3 font-medium">Last Login</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {orgs?.map(org => {
              const userCount = (org.profiles as any[])?.length ?? 0
              const revenue = revenueByOrg[org.id] ?? 0

              return (
                <tr key={org.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                        {org.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{org.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{org.industry?.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs capitalize text-gray-300 bg-gray-800 px-2 py-1 rounded-full">
                      {org.subscription_tier}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={org.subscription_status} />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-300">{userCount}</td>
                  <td className="px-4 py-4 text-sm text-green-400 font-medium">
                    {formatCurrency(revenue)}
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500">
                    {formatDate(org.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500">
                    {lastSignInByOrg[org.id]
                      ? formatDate(lastSignInByOrg[org.id]!, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
                      : <span className="text-gray-600">—</span>
                    }
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/clients/${org.id}`}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    trialing: 'bg-blue-500/20 text-blue-400',
    past_due: 'bg-amber-500/20 text-amber-400',
    canceled: 'bg-red-500/20 text-red-400',
    paused: 'bg-gray-500/20 text-gray-400',
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full capitalize ${map[status] ?? map.paused}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
