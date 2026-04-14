import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function DELETE(_: NextRequest, { params }: { params: { id: string; addressId: string; noteId: string } }) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase, user } = result

  // Only author or owner/admin can delete
  const { data: note } = await supabase
    .from('customer_address_notes')
    .select('author_id')
    .eq('id', params.noteId)
    .eq('address_id', params.addressId)
    .eq('organization_id', profile.organization_id)
    .single()
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

  const canDelete = note.author_id === user.id || ['owner', 'admin', 'office_manager'].includes(profile.role)
  if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('customer_address_notes')
    .delete()
    .eq('id', params.noteId)
    .eq('organization_id', profile.organization_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
