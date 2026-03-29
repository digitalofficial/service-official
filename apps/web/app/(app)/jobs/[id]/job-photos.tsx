'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  jobId: string
  photos: any[]
}

export function JobPhotos({ jobId, photos }: Props) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    let uploaded = 0

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue

      try {
        // Upload file
        const formData = new FormData()
        formData.append('file', file)
        formData.append('job_id', jobId)
        formData.append('file_type', 'image')

        const uploadRes = await fetch('/api/files', { method: 'POST', body: formData })
        if (!uploadRes.ok) throw new Error('Upload failed')

        const { data: fileRecord } = await uploadRes.json()

        // Create photo record
        const res = await fetch('/api/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: jobId,
            storage_path: fileRecord.storage_path,
            public_url: fileRecord.public_url,
            caption: file.name.split('.')[0],
          }),
        })

        if (res.ok) uploaded++
      } catch {}
    }

    if (uploaded > 0) {
      toast.success(`${uploaded} photo${uploaded > 1 ? 's' : ''} uploaded`)
      router.refresh()
    } else {
      toast.error('Failed to upload photos')
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
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
      {photos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No photos yet — upload before/after photos</p>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {photos.map((p: any) => (
            <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
              <img src={p.thumbnail_url ?? p.public_url} alt={p.caption ?? ''} className="w-full h-full object-cover" />
              {(p.is_before || p.is_after) && (
                <span className={`absolute top-1 left-1 text-xs font-bold px-1.5 py-0.5 rounded ${p.is_before ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                  {p.is_before ? 'Before' : 'After'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
