'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  jobId: string
  files: any[]
}

export function JobFiles({ jobId, files }: Props) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles?.length) return

    setUploading(true)
    let uploaded = 0

    for (const file of Array.from(selectedFiles)) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('job_id', jobId)

        const res = await fetch('/api/files', { method: 'POST', body: formData })
        if (res.ok) uploaded++
      } catch {}
    }

    if (uploaded > 0) {
      toast.success(`${uploaded} file${uploaded > 1 ? 's' : ''} uploaded`)
      router.refresh()
    } else {
      toast.error('Failed to upload files')
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Documents ({files.length})
        </h2>
        <div>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>
      {files.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No documents uploaded</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {files.map((f: any) => (
            <div key={f.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{f.original_name ?? f.name}</p>
                  <p className="text-xs text-gray-500">{formatDate(f.created_at, { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
              {f.public_url && (
                <a href={f.public_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View</a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
