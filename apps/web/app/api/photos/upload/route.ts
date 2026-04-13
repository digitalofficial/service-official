import { NextRequest, NextResponse } from 'next/server'
import { getApiProfile } from '@/lib/auth/get-api-profile'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const result = await getApiProfile()
    if ('error' in result) return result.error
    const { user, profile, supabase } = result

    const formData = await request.formData()
    const file = formData.get('file') as File
    const job_id = formData.get('job_id') as string | null
    const project_id = formData.get('project_id') as string | null
    const estimate_id = formData.get('estimate_id') as string | null
    const caption = formData.get('caption') as string | null
    const is_before = formData.get('is_before') === 'true'
    const is_after = formData.get('is_after') === 'true'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!file.type.startsWith('image/') && file.type !== 'application/octet-stream') {
      return NextResponse.json({ error: 'Only images allowed' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const uniqueName = `${uuidv4()}.${ext}`
    const entityPath = job_id ? `jobs/${job_id}` : project_id ? `projects/${project_id}` : estimate_id ? `estimates/${estimate_id}` : 'general'
    const storagePath = `${profile.organization_id}/photos/${entityPath}/${uniqueName}`

    // Upload to storage
    const bytes = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(storagePath, bytes, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('Photo upload error:', uploadError.message)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(storagePath)

    // Create photo record only (NOT in files table)
    const { data: photo, error: dbError } = await supabase
      .from('photos')
      .insert({
        organization_id: profile.organization_id,
        job_id: job_id || null,
        project_id: project_id || null,
        estimate_id: estimate_id || null,
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
