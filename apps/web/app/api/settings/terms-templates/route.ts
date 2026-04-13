import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function GET(request: NextRequest) {
  try {
    const result = await getApiProfile()
    if ('error' in result) return result.error
    const { profile, supabase } = result

    const type = request.nextUrl.searchParams.get('type')

    let query = supabase
      .from('terms_templates')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('name')

    if (type) {
      query = query.or(`type.eq.${type},type.eq.both`)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await getApiProfile()
    if ('error' in result) return result.error
    const { profile, supabase } = result

    const body = await request.json()
    const { name, content, type, is_default } = body

    if (!name || !content || !type) {
      return NextResponse.json({ error: 'Name, content, and type are required' }, { status: 400 })
    }

    if (!['estimate', 'invoice', 'both'].includes(type)) {
      return NextResponse.json({ error: 'Type must be estimate, invoice, or both' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('terms_templates')
      .insert({
        organization_id: profile.organization_id,
        name,
        content,
        type,
        is_default: is_default ?? false,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create template' }, { status: 500 })
  }
}
