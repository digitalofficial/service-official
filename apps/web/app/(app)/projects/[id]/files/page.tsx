import { createServerSupabaseClient } from '@service-official/database'
import { FileUpload } from '@/components/upload/file-upload'
import { FileGrid } from '@/components/files/file-grid'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Project Files' }

export default async function ProjectFilesPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: files } = await supabase
    .from('files')
    .select('*, uploader:profiles!uploaded_by(first_name, last_name)')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  const grouped = {
    blueprints: files?.filter(f => f.file_type === 'blueprint') ?? [],
    contracts: files?.filter(f => ['contract', 'permit', 'inspection'].includes(f.file_type)) ?? [],
    documents: files?.filter(f => ['pdf', 'other'].includes(f.file_type)) ?? [],
    images: files?.filter(f => f.file_type === 'image') ?? [],
  }

  return (
    <div className="space-y-8">
      {/* Upload */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Upload Files</h3>
        <FileUpload
          projectId={params.id}
          label="Upload project files"
          description="Contracts, permits, inspection reports, PDFs, images — any project document"
        />
      </div>

      {/* File Sections */}
      {Object.entries(grouped).map(([category, categoryFiles]) =>
        categoryFiles.length > 0 ? (
          <div key={category}>
            <h3 className="font-semibold text-gray-700 capitalize mb-3">
              {category} ({categoryFiles.length})
            </h3>
            <FileGrid files={categoryFiles} />
          </div>
        ) : null
      )}

      {files?.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">No files yet</p>
          <p className="text-sm mt-1">Upload the first document for this project above.</p>
        </div>
      )}
    </div>
  )
}
