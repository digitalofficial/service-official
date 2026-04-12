import { NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function GET() {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const org_id = profile.organization_id

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString()
  const today = now.toISOString().split('T')[0]

  const [
    invoiceStats,
    lastMonthInvoices,
    ytdInvoices,
    activeProjects,
    completedThisMonth,
    overdueProjects,
    scheduledToday,
    inProgressJobs,
    completedThisWeek,
    newLeads,
    wonLeads,
    totalLeads,
    pendingExpenses,
    monthExpenses,
  ] = await Promise.all([
    // Current month revenue
    supabase.from('invoices')
      .select('amount_paid, total, status')
      .eq('organization_id', org_id)
      .gte('created_at', startOfMonth),

    // Last month
    supabase.from('invoices')
      .select('amount_paid')
      .eq('organization_id', org_id)
      .gte('created_at', startOfLastMonth)
      .lte('created_at', endOfLastMonth),

    // YTD
    supabase.from('invoices')
      .select('amount_paid')
      .eq('organization_id', org_id)
      .gte('created_at', startOfYear),

    // Active projects
    supabase.from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org_id)
      .in('status', ['in_progress', 'approved', 'punch_list']),

    // Completed this month
    supabase.from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org_id)
      .eq('status', 'completed')
      .gte('updated_at', startOfMonth),

    // Overdue
    supabase.from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org_id)
      .eq('status', 'in_progress')
      .lt('estimated_end_date', today),

    // Jobs today
    supabase.from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org_id)
      .gte('scheduled_start', `${today}T00:00:00`)
      .lte('scheduled_start', `${today}T23:59:59`)
      .neq('status', 'canceled'),

    // In progress jobs
    supabase.from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org_id)
      .eq('status', 'in_progress'),

    // Completed this week
    supabase.from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org_id)
      .eq('status', 'completed')
      .gte('actual_end', new Date(now.setDate(now.getDate() - 7)).toISOString()),

    // New leads
    supabase.from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org_id)
      .eq('status', 'new'),

    // Won leads (close rate calc)
    supabase.from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org_id)
      .eq('status', 'won'),

    // Total leads
    supabase.from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', org_id)
      .in('status', ['won', 'lost']),

    // Pending expenses
    supabase.from('expenses')
      .select('total_amount')
      .eq('organization_id', org_id)
      .eq('status', 'pending'),

    // This month expenses
    supabase.from('expenses')
      .select('total_amount')
      .eq('organization_id', org_id)
      .gte('created_at', startOfMonth),
  ])

  const current_month_revenue = invoiceStats.data?.reduce((sum, i) => sum + (i.amount_paid ?? 0), 0) ?? 0
  const outstanding = invoiceStats.data
    ?.filter(i => ['sent', 'viewed', 'partial', 'overdue'].includes(i.status))
    .reduce((sum, i) => sum + ((i.total ?? 0) - (i.amount_paid ?? 0)), 0) ?? 0

  return NextResponse.json({
    data: {
      revenue: {
        current_month: current_month_revenue,
        last_month: lastMonthInvoices.data?.reduce((sum, i) => sum + (i.amount_paid ?? 0), 0) ?? 0,
        ytd: ytdInvoices.data?.reduce((sum, i) => sum + (i.amount_paid ?? 0), 0) ?? 0,
        outstanding,
      },
      projects: {
        active: activeProjects.count ?? 0,
        completed_this_month: completedThisMonth.count ?? 0,
        overdue: overdueProjects.count ?? 0,
      },
      jobs: {
        scheduled_today: scheduledToday.count ?? 0,
        in_progress: inProgressJobs.count ?? 0,
        completed_this_week: completedThisWeek.count ?? 0,
      },
      leads: {
        new: newLeads.count ?? 0,
        won: wonLeads.count ?? 0,
        close_rate: totalLeads.count ? Math.round(((wonLeads.count ?? 0) / totalLeads.count) * 100) : 0,
      },
      expenses: {
        this_month: monthExpenses.data?.reduce((sum, e) => sum + (e.total_amount ?? 0), 0) ?? 0,
        pending_approval: pendingExpenses.data?.reduce((sum, e) => sum + (e.total_amount ?? 0), 0) ?? 0,
      },
    },
  })
}
