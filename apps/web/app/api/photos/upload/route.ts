import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@service-official/database'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const job_id = formData.get('job_id') as string | null
    const project_id = formData.get('project_id') as string | null
    const caption = formData.get('caption') as string | null
    const is_before = formData.get('is_before') === 'true'
    const is_after = formData.get('is_after') === 'true'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!file.type.startsWith('image/') && file.type !== 'application/octet-stream') {
      return NextResponse.json({ error: 'Only images allowed' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const uniqueName = `${uuidv4()}.${ext}`
    const entityPath = job_id ? `jobs/${job_id}` : project_id ? `projects/${project_id}` : 'general'
    const storagePath = `${profile!.organization_id}/photos/${entityPath}/${uniqueName}`

    // Upload to storage
    const serviceClient = createServiceRoleClient()
    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await serviceClient.storage
      .from('files')
      .upload(storagePath, bytes, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('Photo upload error:', uploadError.message)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: { publicUrl } } = serviceClient.storage.from('files').getPublicUrl(storagePath)

    // Create photo record only (NOT in files table)
    const { data: photo, error: dbError } = await supabase
      .from('photos')
      .insert({
        organization_id: profile!.organization_id,
        job_id: job_id || null,
        project_id: project_id || null,
        storage_path: storagePath,
        public_url: publicUrl,
        caption: caption || file.name.split('.')[0],
        is_before,
        is_after,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Photo DB error:', dbError.message)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ data: photo, success: true }, { status: 201 })
  } catch (error: any) {
    console.error('Photo upload error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
