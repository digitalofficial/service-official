import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  try {
    const { error } = await supabase
      .from('saved_reports')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Failed to delete' }, { status: 500 })
  }
}
