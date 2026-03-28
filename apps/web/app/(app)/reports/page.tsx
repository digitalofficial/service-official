import { createServerSupabaseClient } from '@service-official/database'
import { PageHeader } from '@/components/ui/page-header'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, FolderKanban, Briefcase, UserPlus, TrendingUp, TrendingDown, Receipt, CreditCard } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reports' }

export default async function ReportsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()
  const orgId = profile!.organization_id

  // Fetch metrics in parallel
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString()

  const [
    { count: activeProjects },
    { count: completedThisMonth },
    { count: totalCustomers },
    { count: newLeads },
    { data: recentInvoices },
    { data: recentExpenses },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['in_progress', 'approved']),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'completed').gte('updated_at', startOfMonth),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'new'),
    supabase.from('invoices').select('total, amount_paid, amount_due, status').eq('organization_id', orgId),
    supabase.from('expenses').select('total_amount, category').eq('organization_id', orgId).gte('expense_date', startOfMonth),
  ])

  const invoiceTotals = (recentInvoices ?? []).reduce(
    (acc: any, inv: any) => ({
      total: acc.total + (inv.total ?? 0),
      paid: acc.paid + (inv.amount_paid ?? 0),
      outstanding: acc.outstanding + (inv.amount_due ?? 0),
    }),
    { total: 0, paid: 0, outstanding: 0 }
  )

  const expenseTotal = (recentExpenses ?? []).reduce((sum: number, e: any) => sum + (e.total_amount ?? 0), 0)

  const metrics = [
    { label: 'Total Revenue', value: formatCurrency(invoiceTotals.paid), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Outstanding', value: formatCurrency(invoiceTotals.outstanding), icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Expenses (Month)', value: formatCurrency(expenseTotal), icon: CreditCard, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Active Projects', value: String(activeProjects ?? 0), icon: FolderKanban, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed (Month)', value: String(completedThisMonth ?? 0), icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Customers', value: String(totalCustomers ?? 0), icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'New Leads', value: String(newLeads ?? 0), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Net Revenue', value: formatCurrency(invoiceTotals.paid - expenseTotal), icon: invoiceTotals.paid - expenseTotal >= 0 ? TrendingUp : TrendingDown, color: invoiceTotals.paid - expenseTotal >= 0 ? 'text-green-600' : 'text-red-600', bg: invoiceTotals.paid - expenseTotal >= 0 ? 'bg-green-50' : 'bg-red-50' },
  ]

  // Expense breakdown
  const expenseBreakdown = (recentExpenses ?? []).reduce((acc: Record<string, number>, e: any) => {
    const cat = e.category ?? 'other'
    acc[cat] = (acc[cat] ?? 0) + (e.total_amount ?? 0)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Financial overview and key metrics" />

      {/* Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${m.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{m.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{m.label}</p>
            </div>
          )
        })}
      </div>

      {/* Expense Breakdown */}
      {Object.keys(expenseBreakdown).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Expenses This Month by Category</h2>
          <div className="space-y-3">
            {Object.entries(expenseBreakdown)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 capitalize">{category.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, ((amount as number) / expenseTotal) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-24 text-right">{formatCurrency(amount as number)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
