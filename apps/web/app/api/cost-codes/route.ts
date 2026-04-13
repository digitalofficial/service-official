import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function GET(request: NextRequest) {
  try {
    const result = await getApiProfile()
    if ('error' in result) return result.error
    const { profile, supabase } = result

    const { data, error } = await supabase
      .from('cost_codes')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('code')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch cost codes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getApiProfile()
    if ('error' in result) return result.error
    const { profile, supabase } = result

    const body = await request.json()

    // Support bulk import (array) or single create (object)
    const items = Array.isArray(body) ? body : [body]

    const rows = items.map((item: any) => ({
      organization_id: profile.organization_id,
      code: item.code,
      name: item.name,
      description: item.description || null,
      category: item.category || null,
      parent_code: item.parent_code || null,
      is_active: item.is_active ?? true,
    }))

    for (const row of rows) {
      if (!row.code || !row.name) {
        return NextResponse.json({ error: 'Code and name are required for all items' }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('cost_codes')
      .upsert(rows, { onConflict: 'organization_id,code' })
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create cost codes' }, { status: 500 })
  }
}
