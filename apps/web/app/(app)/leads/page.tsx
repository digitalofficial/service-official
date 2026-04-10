import Link from 'next/link'
import { getProfile } from '@/lib/auth/get-profile'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatDate, statusColor } from '@/lib/utils'
import { Plus, UserPlus, Search, DollarSign, Calendar, User } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Leads' }

const LEAD_COLUMNS = [
  { key: 'new', label: 'New', color: 'bg-gray-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
  { key: 'qualified', label: 'Qualified', color: 'bg-indigo-500' },
  { key: 'proposal', label: 'Proposal', color: 'bg-purple-500' },
  { key: 'negotiating', label: 'Negotiating', color: 'bg-amber-500' },
]

interface Props {
  searchParams: { view?: 'kanban' | 'list' }
}

export default async function LeadsPage({ searchParams }: Props) {
  const { supabase, profile } = await getProfile()

  const { data: leads } = await supabase
    .from('leads')
    .select(`
      *,
      customer:customers(id, first_name, last_name, company_name),
      assignee:profiles!assigned_to(id, first_name, last_name, avatar_url)
    `)
    .eq('organization_id', profile.organization_id)
    .not('status', 'in', '("won","lost","unqualified")')
    .order('created_at', { ascending: false })

  const grouped = LEAD_COLUMNS.map((col) => ({
    ...col,
    leads: (leads ?? []).filter((l: any) => l.status === col.key),
    total: (leads ?? []).filter((l: any) => l.status === col.key).reduce((sum: number, l: any) => sum + (l.estimated_value ?? 0), 0),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description={`${leads?.length ?? 0} active leads`}
        actions={
          <Link href="/leads/new">
            <Button><Plus className="w-4 h-4 mr-2" />New Lead</Button>
          </Link>
        }
      />

      {/* Pipeline value */}
      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="text-gray-500">Pipeline Value: </span>
          <span className="font-semibold text-gray-900">
            {formatCurrency((leads ?? []).reduce((sum: number, l: any) => sum + (l.estimated_value ?? 0), 0))}
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      {!leads || leads.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="w-12 h-12" />}
          title="No leads yet"
          description="Add your first lead to start tracking your sales pipeline."
          action={
            <Link href="/leads/new">
              <Button><Plus className="w-4 h-4 mr-2" />Add Lead</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
          {grouped.map((col) => (
            <div key={col.key} className="flex-shrink-0 w-72">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                  <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {col.leads.length}
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-500">{formatCurrency(col.total)}</span>
              </div>

              {/* Cards */}
              <div className="space-y-2.5">
                {col.leads.map((lead: any) => (
                  <Link key={lead.id} href={`/leads/${lead.id}`}>
                    <div className="bg-white rounded-lg border border-gray-200 p-3.5 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">{lead.title}</h4>

                      {lead.customer && (
                        <p className="text-xs text-gray-500 mb-2">
                          {lead.customer.company_name ?? `${lead.customer.first_name} ${lead.customer.last_name}`}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {lead.estimated_value && (
                            <span className="flex items-center gap-0.5 font-medium text-gray-700">
                              <DollarSign className="w-3 h-3" />
                              {lead.estimated_value.toLocaleString()}
                            </span>
                          )}
                          {lead.follow_up_date && (
                            <span className="flex items-center gap-0.5">
                              <Calendar className="w-3 h-3" />
                              {formatDate(lead.follow_up_date, { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        {lead.assignee && (
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold" title={`${lead.assignee.first_name} ${lead.assignee.last_name}`}>
                            {lead.assignee.first_name?.[0]}
                          </div>
                        )}
                      </div>

                      {lead.tags?.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {lead.tags.map((tag: string) => (
                            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
