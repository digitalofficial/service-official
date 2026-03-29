import { createServerSupabaseClient } from '@service-official/database'
import { PageHeader } from '@/components/ui/page-header'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, TrendingUp, TrendingDown, Receipt, CreditCard, Briefcase, UserPlus, Target } from 'lucide-react'
import { ReportsCharts } from './reports-charts'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reports & Analytics' }

export default async function ReportsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const orgId = profile?.organization_id
  if (!orgId) return null

  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString()

  // Fetch all data in parallel
  const [
    { data: invoices },
    { data: expenses },
    { data: jobs },
    { data: leads },
    { data: customers },
  ] = await Promise.all([
    supabase.from('invoices').select('id, total, amount_paid, amount_due, status, issue_date, customer_id').eq('organization_id', orgId),
    supabase.from('expenses').select('id, total_amount, category, expense_date').eq('organization_id', orgId).gte('expense_date', twelveMonthsAgo),
    supabase.from('jobs').select('id, status, scheduled_start, actual_end').eq('organization_id', orgId).gte('created_at', twelveMonthsAgo),
    supabase.from('leads').select('id, status, created_at').eq('organization_id', orgId),
    supabase.from('customers').select('id, first_name, last_name, company_name, total_revenue').eq('organization_id', orgId).eq('is_active', true).order('total_revenue', { ascending: false }).limit(10),
  ])

  // === Top Metrics ===
  const totalRevenue = (invoices ?? []).reduce((sum, i) => sum + (i.amount_paid ?? 0), 0)
  const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + (e.total_amount ?? 0), 0)
  const outstanding = (invoices ?? []).filter(i => ['sent', 'partial', 'overdue', 'viewed'].includes(i.status)).reduce((sum, i) => sum + (i.amount_due ?? 0), 0)
  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100) : 0

  const totalLeads = (leads ?? []).length
  const wonLeads = (leads ?? []).filter(l => l.status === 'won').length
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads * 100) : 0

  const completedJobs = (jobs ?? []).filter(j => j.status === 'completed').length

  // === Monthly Revenue (last 12 months) ===
  const monthlyRevenue: { month: string; revenue: number; expenses: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = d.toISOString().slice(0, 7) // YYYY-MM
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

    const monthRevenue = (invoices ?? [])
      .filter(inv => inv.issue_date?.startsWith(monthKey))
      .reduce((sum, inv) => sum + (inv.amount_paid ?? 0), 0)

    const monthExpenses = (expenses ?? [])
      .filter(exp => exp.expense_date?.startsWith(monthKey))
      .reduce((sum, exp) => sum + (exp.total_amount ?? 0), 0)

    monthlyRevenue.push({ month: monthLabel, revenue: monthRevenue, expenses: monthExpenses })
  }

  // === Jobs Completed Per Month ===
  const monthlyJobs: { month: string; completed: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = d.toISOString().slice(0, 7)
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

    const completed = (jobs ?? []).filter(j =>
      j.status === 'completed' && j.actual_end?.startsWith(monthKey)
    ).length

    monthlyJobs.push({ month: monthLabel, completed })
  }

  // === Expense Breakdown ===
  const expenseByCategory: { name: string; value: number }[] = []
  const categoryMap: Record<string, number> = {}
  for (const exp of (expenses ?? [])) {
    const cat = (exp.category ?? 'other').replace(/_/g, ' ')
    categoryMap[cat] = (categoryMap[cat] ?? 0) + (exp.total_amount ?? 0)
  }
  for (const [name, value] of Object.entries(categoryMap).sort((a, b) => b[1] - a[1])) {
    expenseByCategory.push({ name, value })
  }

  // === Top Customers ===
  const topCustomers = (customers ?? []).filter(c => (c.total_revenue ?? 0) > 0).map(c => ({
    name: c.company_name ?? `${c.first_name} ${c.last_name}`,
    revenue: c.total_revenue ?? 0,
  }))

  const metrics = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Expenses', value: formatCurrency(totalExpenses), icon: CreditCard, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Profit Margin', value: `${profitMargin.toFixed(1)}%`, icon: profitMargin >= 0 ? TrendingUp : TrendingDown, color: profitMargin >= 0 ? 'text-green-600' : 'text-red-600', bg: profitMargin >= 0 ? 'bg-green-50' : 'bg-red-50' },
    { label: 'Outstanding', value: formatCurrency(outstanding), icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Jobs Completed', value: String(completedJobs), icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Lead Conversion', value: `${conversionRate.toFixed(0)}%`, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Leads', value: String(totalLeads), icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Net Profit', value: formatCurrency(totalRevenue - totalExpenses), icon: totalRevenue - totalExpenses >= 0 ? TrendingUp : TrendingDown, color: totalRevenue - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600', bg: totalRevenue - totalExpenses >= 0 ? 'bg-green-50' : 'bg-red-50' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Financial performance and key metrics" />

      {/* Metric Cards */}
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

      {/* Charts */}
      <ReportsCharts
        monthlyRevenue={monthlyRevenue}
        monthlyJobs={monthlyJobs}
        expenseByCategory={expenseByCategory}
        topCustomers={topCustomers}
        totalExpenses={totalExpenses}
      />
    </div>
  )
}
