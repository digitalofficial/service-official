import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { getTemplate } from '@/lib/reports/templates'
import { queryRegistry } from '@/lib/reports/queries'
import type { ReportFilters } from '@/lib/reports/types'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 })

  const template = getTemplate(slug)
  if (!template) return NextResponse.json({ error: 'Unknown report template' }, { status: 404 })

  const queryFn = queryRegistry[slug]
  if (!queryFn) return NextResponse.json({ error: 'No query for this template' }, { status: 404 })

  const filters: ReportFilters = {
    date_from: searchParams.get('date_from') ?? undefined,
    date_to: searchParams.get('date_to') ?? undefined,
    customer_id: searchParams.get('customer_id') ?? undefined,
    project_id: searchParams.get('project_id') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    group_by: searchParams.get('group_by') ?? template.defaultGroupBy,
  }

  try {
    const data = await queryFn(supabase, profile.organization_id, filters)

    // Compute summary totals for columns that have showTotal
    const summary: Record<string, number> = {}
    for (const col of template.columns) {
      if (col.showTotal) {
        summary[col.key] = data.reduce((sum, row) => sum + (Number(row[col.key]) || 0), 0)
      }
    }

    return NextResponse.json({ data, columns: template.columns, summary })
  } catch (err: any) {
    console.error('Report query error:', err)
    return NextResponse.json({ error: err.message ?? 'Query failed' }, { status: 500 })
  }
}
