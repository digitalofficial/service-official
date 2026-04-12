import { getProfile } from '@/lib/auth/get-profile'
import { FileUpload } from '@/components/upload/file-upload'
import { ProjectFiles } from './project-files'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Project Files' }

export default async function ProjectFilesPage({ params }: { params: { id: string } }) {
  const { supabase } = await getProfile()

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
      <ProjectFiles grouped={grouped} />
    </div>
  )
}
