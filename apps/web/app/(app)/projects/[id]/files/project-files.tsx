'use client'

import { useState } from 'react'
import { FileGrid } from '@/components/files/file-grid'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ProjectFilesProps {
  grouped: {
    blueprints: any[]
    contracts: any[]
    documents: any[]
    images: any[]
  }
}

const LABELS: Record<string, string> = {
  blueprints: 'Blueprints',
  contracts: 'Contracts / Permits / Inspections',
  documents: 'Documents',
  images: 'Images',
}

export function ProjectFiles({ grouped }: ProjectFilesProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(fileId: string) {
    if (!confirm('Delete this file? This cannot be undone.')) return
    setDeleting(fileId)
    const res = await fetch(`/api/files?file_id=${fileId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('File deleted')
      router.refresh()
    } else {
      const err = await res.json().catch(() => ({}))
      toast.error(err.error || 'Failed to delete file')
    }
    setDeleting(null)
  }

  const hasFiles = Object.values(grouped).some(files => files.length > 0)

  return (
    <>
      {Object.entries(grouped).map(([category, categoryFiles]) =>
        categoryFiles.length > 0 ? (
          <div key={category}>
            <h3 className="font-semibold text-gray-700 mb-3">
              {LABELS[category] || category} ({categoryFiles.length})
            </h3>
            <FileGrid files={categoryFiles} onDelete={handleDelete} />
          </div>
        ) : null
      )}

      {!hasFiles && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">No files yet</p>
          <p className="text-sm mt-1">Upload the first document for this project above.</p>
        </div>
      )}
    </>
  )
}
