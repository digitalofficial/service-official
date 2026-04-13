'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Plus, Loader2, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  estimateId: string
  photos: any[]
}

export function EstimatePhotos({ estimateId, photos }: Props) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    let uploaded = 0

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/') && file.type !== 'application/octet-stream') continue

        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('estimate_id', estimateId)

          const res = await fetch('/api/photos/upload', { method: 'POST', body: formData })
          if (res.ok) uploaded++
        } catch {}
      }

      if (uploaded > 0) {
        toast.success(`${uploaded} photo${uploaded > 1 ? 's' : ''} uploaded`)
        router.refresh()
      } else {
        toast.error('Failed to upload photos')
      }
    } catch {
      toast.error('Failed to upload photos')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (confirmText !== 'delete') return
    try {
      const res = await fetch(`/api/photos?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Photo deleted')
        setDeleting(null)
        setConfirmText('')
        router.refresh()
      } else {
        toast.error('Failed to delete')
      }
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Camera className="w-4 h-4" /> Photos ({photos.length})
        </h2>
        <div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading...' : 'Upload Photos'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleting && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-800">Are you sure? This cannot be undone.</p>
          <p className="text-xs text-red-600 mt-1">Type <strong>delete</strong> to confirm:</p>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="delete"
              className="px-3 py-1.5 text-sm border border-red-300 rounded-lg focus:outline-none focus:border-red-400 w-32"
              autoFocus
            />
            <button
              onClick={() => handleDelete(deleting)}
              disabled={confirmText !== 'delete'}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
            >
              Delete Photo
            </button>
            <button
              onClick={() => { setDeleting(null); setConfirmText('') }}
              className="p-1.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {photos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No photos yet — attach reference photos to this estimate</p>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {photos.map((p: any) => (
            <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative group">
              <img src={p.thumbnail_url ?? p.public_url} alt={p.caption ?? ''} className="w-full h-full object-cover" />
              <button
                onClick={() => setDeleting(p.id)}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
