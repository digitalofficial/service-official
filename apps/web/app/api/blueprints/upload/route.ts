import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceRoleClient } from '@service-official/database'
import { v4 as uuidv4 } from 'uuid'

// Step 1: Get a signed upload URL for direct-to-storage upload (bypasses API body limits)
// Step 2: After client uploads directly to storage, create blueprint + file records
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

    const body = await request.json()
    const { action } = body

    // Action 1: Get a signed upload URL
    if (action === 'get-upload-url') {
      const { file_name, file_size, content_type, project_id } = body

      if (!file_name) return NextResponse.json({ error: 'file_name required' }, { status: 400 })

      // Allow up to 500MB for blueprints
      const MAX_BLUEPRINT_SIZE = 500 * 1024 * 1024
      if (file_size && file_size > MAX_BLUEPRINT_SIZE) {
        return NextResponse.json({ error: 'File too large (max 500MB for blueprints)' }, { status: 400 })
      }

      const ext = file_name.split('.').pop() || 'pdf'
      const fileId = uuidv4()
      const storagePath = `${profile!.organization_id}/blueprints/${project_id || 'general'}/${fileId}.${ext}`

      // Create a signed upload URL using service role
      const serviceClient = createServiceRoleClient()
      const { data: signedUrl, error: signError } = await serviceClient.storage
        .from('files')
        .createSignedUploadUrl(storagePath)

      if (signError) {
        console.error('Signed URL error:', signError)
        // Fallback: return the path for direct upload
        return NextResponse.json({
          data: {
            storage_path: storagePath,
            file_id: fileId,
            method: 'direct',
          }
        })
      }

      return NextResponse.json({
        data: {
          signed_url: signedUrl.signedUrl,
          token: signedUrl.token,
          storage_path: storagePath,
          file_id: fileId,
          method: 'signed',
        }
      })
    }

    // Action 2: Complete upload — create file + blueprint records
    if (action === 'complete') {
      const { storage_path, file_name, file_size, content_type, project_id, name, description, discipline, scale } = body

      if (!storage_path || !file_name) {
        return NextResponse.json({ error: 'storage_path and file_name required' }, { status: 400 })
      }

      const serviceClient = createServiceRoleClient()

      // Get public URL
      const { data: { publicUrl } } = serviceClient.storage.from('files').getPublicUrl(storage_path)

      // Create file record
      const { data: fileRecord, error: fileError } = await supabase
        .from('files')
        .insert({
          organization_id: profile!.organization_id,
          project_id: project_id || null,
          name: name || file_name.split('.')[0],
          original_name: file_name,
          file_type: 'blueprint',
          mime_type: content_type || 'application/pdf',
          size_bytes: file_size || 0,
          storage_path,
          public_url: publicUrl,
          is_public: false,
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (fileError) {
        console.error('File record error:', fileError)
        return NextResponse.json({ error: 'Failed to create file record' }, { status: 500 })
      }

      // Create blueprint record
      const { data: blueprint, error: bpError } = await supabase
        .from('blueprints')
        .insert({
          organization_id: profile!.organization_id,
          project_id: project_id || null,
          name: name || file_name.split('.')[0],
          description: description || null,
          version: '1.0',
          discipline: discipline || null,
          scale: scale || null,
          file_id: fileRecord.id,
          storage_path,
          public_url: publicUrl,
          is_processed: false,
          processing_status: 'uploaded',
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (bpError) {
        console.error('Blueprint record error:', bpError)
        return NextResponse.json({ error: 'Failed to create blueprint record' }, { status: 500 })
      }

      return NextResponse.json({
        data: {
          file: fileRecord,
          blueprint,
        },
        success: true,
      }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Blueprint upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
