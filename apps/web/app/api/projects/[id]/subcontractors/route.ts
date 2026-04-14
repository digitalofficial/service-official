import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { z } from 'zod'

const assignSchema = z.object({
  subcontractor_id: z.string().uuid(),
  scope: z.string().optional().nullable(),
  contract_amount: z.number().optional().nullable(),
  status: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  // Verify project belongs to org first (defense-in-depth alongside RLS)
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
    .single()
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('project_subcontractors')
    .select('*, subcontractor:subcontractors(id, company_name, contact_name, email, phone, trade, insurance_expiry, general_liability_expiry, workers_comp_expiry)')
    .eq('project_id', params.id)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile({ requireRole: ['owner', 'admin', 'office_manager', 'project_manager'] })
  if ('error' in result) return result.error
  const { profile, supabase, user } = result

  let body: any
  try {
    body = assignSchema.parse(await req.json())
  } catch (err: any) {
    return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 })
  }

  // Verify project + subcontractor both belong to org (prevent cross-org)
  const [{ data: project }, { data: sub }] = await Promise.all([
    supabase.from('projects').select('id').eq('id', params.id).eq('organization_id', profile.organization_id).single(),
    supabase.from('subcontractors').select('id').eq('id', body.subcontractor_id).eq('organization_id', profile.organization_id).single(),
  ])
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!sub) return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('project_subcontractors')
    .insert({
      ...body,
      project_id: params.id,
      organization_id: profile.organization_id,
      assigned_by: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Subcontractor already assigned to this project' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, success: true }, { status: 201 })
}
