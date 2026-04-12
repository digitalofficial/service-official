'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

export function UploadPhotosButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    let uploaded = 0
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/') && file.type !== 'application/octet-stream') continue
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('project_id', projectId)
        const res = await fetch('/api/photos/upload', { method: 'POST', body: formData })
        if (res.ok) uploaded++
      } catch {}
    }
    if (uploaded > 0) { toast.success(`${uploaded} photo${uploaded > 1 ? 's' : ''} uploaded`); router.refresh() }
    else { toast.error('Failed to upload') }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
      <button onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {uploading ? 'Uploading...' : 'Upload Photos'}
      </button>
    </div>
  )
}

export function DeletePhotoButton({ photoId }: { photoId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this photo?')) return
    setDeleting(true)
    const res = await fetch(`/api/photos?id=${photoId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Photo deleted'); router.refresh() }
    else toast.error('Failed to delete')
    setDeleting(false)
  }

  return (
    <button onClick={handleDelete} disabled={deleting} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50">
      {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
    </button>
  )
}
