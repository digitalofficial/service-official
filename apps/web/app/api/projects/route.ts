import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { createProject, getProjects } from '@service-official/database/queries/projects'
import { trigger } from '@service-official/workflows'
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  customer_id: z.string().uuid().optional(),
  status: z.string().optional(),
  industry: z.string().optional(),
  type: z.string().optional(),
  address_line1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  contract_value: z.number().optional(),
  estimated_start_date: z.string().optional(),
  estimated_end_date: z.string().optional(),
  project_manager_id: z.string().uuid().optional(),
  foreman_id: z.string().uuid().optional(),
  roof_type: z.string().optional(),
  roof_squares: z.number().optional(),
  permit_number: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)

    const result = await getProjects({
      organization_id: profile.organization_id,
      status: searchParams.get('status') ?? undefined,
      customer_id: searchParams.get('customer_id') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: Number(searchParams.get('page') ?? 1),
      per_page: Number(searchParams.get('per_page') ?? 20),
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Role check
    const allowedRoles = ['owner', 'admin', 'office_manager', 'project_manager', 'estimator']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validated = createProjectSchema.parse(body)

    const project = await createProject({
      ...validated,
      organization_id: profile.organization_id,
      created_by: user.id,
    })

    // Fire automation trigger
    trigger('project.created')(
      profile.organization_id,
      'project',
      project.id,
      { project_name: project.name, status: project.status }
    )

    return NextResponse.json({ data: project, success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
