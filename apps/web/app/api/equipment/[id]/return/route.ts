import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

  // Find current assignment
  const { data: assignment } = await supabase
    .from('equipment_assignments')
    .select('*')
    .eq('equipment_id', params.id)
    .is('actual_return_date', null)
    .order('start_date', { ascending: false })
    .limit(1)
    .single()

  if (!assignment) {
    return NextResponse.json({ error: 'No active assignment found' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const returnDate = new Date().toISOString().split('T')[0]

  // Calculate total cost
  const startDate = new Date(assignment.start_date)
  const endDate = new Date(returnDate)
  const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  const totalCost = assignment.daily_rate ? days * assignment.daily_rate : null

  // Update assignment
  const { error: assignError } = await supabase
    .from('equipment_assignments')
    .update({
      actual_return_date: returnDate,
      total_cost: totalCost,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assignment.id)

  if (assignError) return NextResponse.json({ error: assignError.message }, { status: 500 })

  // Update equipment status back to available
  await supabase
    .from('equipment')
    .update({
      status: 'available',
      current_location: body.location || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  // Create expense record if there's a cost and a project
  if (totalCost && assignment.project_id) {
    await supabase.from('expenses').insert({
      organization_id: profile.organization_id,
      project_id: assignment.project_id,
      title: `Equipment rental`,
      description: `Equipment assignment ${days} days`,
      category: 'equipment',
      amount: totalCost,
      tax_amount: 0,
      total_amount: totalCost,
      is_billable: true,
      is_reimbursable: false,
      expense_date: returnDate,
      submitted_by: user.id,
      status: 'approved',
    })
  }

  return NextResponse.json({ data: { days, total_cost: totalCost }, success: true })
}
