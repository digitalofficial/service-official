import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getApiProfile()
    if ('error' in result) return result.error
    const { profile, supabase } = result
    const { id } = await params

    const body = await request.json()
    const allowed = ['account_number', 'name', 'type', 'subtype', 'parent_id', 'description', 'is_active']
    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', profile.organization_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update account' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getApiProfile()
    if ('error' in result) return result.error
    const { profile, supabase } = result
    const { id } = await params

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('organization_id', profile.organization_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete account' }, { status: 500 })
  }
}
