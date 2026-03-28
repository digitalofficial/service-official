import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { trigger } from '@service-official/workflows'
import { z } from 'zod'

const expenseSchema = z.object({
  project_id: z.string().uuid().optional(),
  job_id: z.string().uuid().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string(),
  amount: z.number().positive(),
  tax_amount: z.number().min(0).default(0),
  vendor_name: z.string().optional(),
  vendor_invoice_number: z.string().optional(),
  is_billable: z.boolean().default(false),
  is_reimbursable: z.boolean().default(false),
  expense_date: z.string(),
  receipt_file_id: z.string().uuid().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const { searchParams } = new URL(request.url)

  let query = supabase
    .from('expenses')
    .select('*, submitter:profiles!submitted_by(first_name, last_name, avatar_url), approver:profiles!approved_by(first_name, last_name)')
    .eq('organization_id', profile!.organization_id)
    .order('created_at', { ascending: false })

  if (searchParams.get('project_id')) query = query.eq('project_id', searchParams.get('project_id')!)
  if (searchParams.get('status')) query = query.eq('status', searchParams.get('status')!)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

  const body = await request.json()
  const validated = expenseSchema.parse(body)

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      ...validated,
      total_amount: validated.amount + validated.tax_amount,
      organization_id: profile!.organization_id,
      submitted_by: user.id,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Trigger automation
  trigger('expense.submitted')(
    profile!.organization_id,
    'expense',
    data.id,
    { title: data.title, total_amount: data.total_amount, project_id: data.project_id }
  )

  return NextResponse.json({ data, success: true }, { status: 201 })
}
