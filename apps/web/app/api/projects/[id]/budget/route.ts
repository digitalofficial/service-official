import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const projectId = params.id

  // Verify project belongs to org
  const { data: project } = await supabase
    .from('projects')
    .select('id, contract_value')
    .eq('id', projectId)
    .eq('organization_id', profile!.organization_id)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Fetch budget categories
  const { data: categories } = await supabase
    .from('budget_categories')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index')

  // Fetch actuals in parallel
  const [expensesRes, materialsRes, timeEntriesRes] = await Promise.all([
    supabase
      .from('expenses')
      .select('category, total_amount, budget_category_id')
      .eq('project_id', projectId)
      .in('status', ['approved', 'reimbursed']),
    supabase
      .from('project_materials')
      .select('total_cost, budget_category_id')
      .eq('project_id', projectId),
    supabase
      .from('time_entries')
      .select('hours, jobs!inner(project_id)')
      .eq('jobs.project_id', projectId),
  ])

  const expenses = expensesRes.data || []
  const materials = materialsRes.data || []
  const timeEntries = timeEntriesRes.data || []

  // Calculate total labor cost (use average hourly rate of $45 if not specified per entry)
  const totalLaborHours = timeEntries.reduce((sum: number, t: any) => sum + (t.hours || 0), 0)
  const totalLaborCost = totalLaborHours * 45 // Default rate; could be refined per-employee

  // Map actuals to categories
  const categoryActuals: Record<string, number> = {}

  // Map expenses by budget_category_id
  for (const exp of expenses) {
    if (exp.budget_category_id) {
      categoryActuals[exp.budget_category_id] = (categoryActuals[exp.budget_category_id] || 0) + (exp.total_amount || 0)
    }
  }

  // Map material costs by budget_category_id
  for (const mat of materials) {
    if (mat.budget_category_id) {
      categoryActuals[mat.budget_category_id] = (categoryActuals[mat.budget_category_id] || 0) + (mat.total_cost || 0)
    }
  }

  // Compute expense totals by category type for unassigned expenses
  const expenseByType: Record<string, number> = {}
  for (const exp of expenses) {
    if (!exp.budget_category_id) {
      expenseByType[exp.category] = (expenseByType[exp.category] || 0) + (exp.total_amount || 0)
    }
  }

  // Unassigned material costs
  const unassignedMaterialCost = materials
    .filter(m => !m.budget_category_id)
    .reduce((sum, m) => sum + (m.total_cost || 0), 0)

  // Build enriched categories
  const enrichedCategories = (categories || []).map(cat => {
    // Direct assigned actuals
    let actual = categoryActuals[cat.id] || 0

    // Also add unassigned expenses matching category type
    if (expenseByType[cat.type]) {
      actual += expenseByType[cat.type]
      delete expenseByType[cat.type] // only count once
    }

    // Add unassigned materials to 'materials' category
    if (cat.type === 'materials' && unassignedMaterialCost > 0) {
      actual += unassignedMaterialCost
    }

    // Add labor to 'labor' category
    if (cat.type === 'labor') {
      actual += totalLaborCost
    }

    const variance = cat.budgeted_amount - actual
    const percent_used = cat.budgeted_amount > 0 ? (actual / cat.budgeted_amount) * 100 : 0

    return { ...cat, actual_amount: actual, variance, percent_used }
  })

  const totalBudget = enrichedCategories.reduce((sum, c) => sum + c.budgeted_amount, 0)
  const totalActual = enrichedCategories.reduce((sum, c) => sum + c.actual_amount, 0)
  const totalVariance = totalBudget - totalActual
  const percentUsed = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0

  // Simple forecast: EAC based on current burn rate and project progress
  const forecastAtCompletion = totalActual > 0 && percentUsed > 0
    ? totalActual / (percentUsed / 100)
    : totalBudget

  return NextResponse.json({
    data: {
      total_budget: totalBudget,
      total_actual: totalActual,
      total_variance: totalVariance,
      percent_used: percentUsed,
      categories: enrichedCategories,
      forecast_at_completion: forecastAtCompletion,
      estimated_over_under: totalBudget - forecastAtCompletion,
      labor_hours: totalLaborHours,
      labor_cost: totalLaborCost,
    }
  })
}
