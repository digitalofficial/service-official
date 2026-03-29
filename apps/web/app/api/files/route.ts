import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@service-official/database'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'image/heic', 'image/heif', 'image/svg+xml', 'image/bmp', 'image/tiff',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  'application/octet-stream', // fallback for unknown types
]

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const project_id = formData.get('project_id') as string | null
    const job_id = formData.get('job_id') as string | null
    const customer_id = formData.get('customer_id') as string | null
    const file_type = formData.get('file_type') as string | null
    const description = formData.get('description') as string | null
    const is_public = formData.get('is_public') === 'true'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error('File type rejected:', file.type, file.name)
      return NextResponse.json({ error: `File type "${file.type}" not allowed` }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })

    // Build storage path: org_id/entity_type/entity_id/uuid.ext
    const ext = file.name.split('.').pop()
    const uniqueName = `${uuidv4()}.${ext}`
    const entityPath = project_id ? `projects/${project_id}` : job_id ? `jobs/${job_id}` : `customers/${customer_id ?? 'general'}`
    const storagePath = `${profile!.organization_id}/${entityPath}/${uniqueName}`

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer()
    const { data: upload, error: uploadError } = await supabase.storage
      .from('files')
      .upload(storagePath, bytes, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(storagePath)

    // Save to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        organization_id: profile!.organization_id,
        project_id,
        job_id,
        customer_id,
        name: file.name.split('.')[0],
        original_name: file.name,
        file_type: file_type ?? 'other',
        mime_type: file.type,
        size_bytes: file.size,
        storage_path: storagePath,
        public_url: publicUrl,
        description,
        is_public,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ data: fileRecord, success: true }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const project_id = searchParams.get('project_id')
  const job_id = searchParams.get('job_id')
  const customer_id = searchParams.get('customer_id')

  let query = supabase.from('files').select('*, uploader:profiles!uploaded_by(first_name, last_name)')

  if (project_id) query = query.eq('project_id', project_id)
  if (job_id) query = query.eq('job_id', job_id)
  if (customer_id) query = query.eq('customer_id', customer_id)

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}
