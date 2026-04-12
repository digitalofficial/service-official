import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'

export async function POST(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { user, profile, supabase } = result

  const body = await request.json()
  const { project_id, job_id, storage_path, public_url, caption, is_before, is_after } = body

  if (!storage_path || !public_url) {
    return NextResponse.json({ error: 'storage_path and public_url required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('photos')
    .insert({
      organization_id: profile.organization_id,
      project_id: project_id || null,
      job_id: job_id || null,
      storage_path,
      public_url,
      caption: caption || null,
      is_before: is_before || false,
      is_after: is_after || false,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, success: true }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const result = await getApiProfile()
  if ('error' in result) return result.error
  const { profile, supabase } = result

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  // Get the photo and verify it belongs to the user's org
  const { data: photo } = await supabase.from('photos').select('storage_path, organization_id').eq('id', id).single()
  if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
  if (photo.organization_id !== profile.organization_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Soft-delete from database (preserve storage file for archival)
  const { error } = await supabase
    .from('photos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
