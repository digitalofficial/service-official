import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@service-official/database'

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

  const body = await request.json()
  const { project_id, job_id, storage_path, public_url, caption, is_before, is_after } = body

  if (!storage_path || !public_url) {
    return NextResponse.json({ error: 'storage_path and public_url required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('photos')
    .insert({
      organization_id: profile!.organization_id,
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
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  // Get the photo to find storage path
  const { data: photo } = await supabase.from('photos').select('storage_path').eq('id', id).single()

  // Delete from storage
  if (photo?.storage_path) {
    const serviceClient = createServiceRoleClient()
    await serviceClient.storage.from('files').remove([photo.storage_path])
  }

  // Delete from database
  const { error } = await supabase.from('photos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
