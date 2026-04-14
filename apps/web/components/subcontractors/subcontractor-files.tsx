'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Upload, Camera, FileText, Trash2, Download, ImageIcon, Paperclip } from 'lucide-react'
import { toast } from 'sonner'

interface FileRecord {
  id: string
  name: string
  original_name: string
  mime_type: string | null
  size_bytes: number | null
  public_url: string | null
  file_type: string | null
  description: string | null
  created_at: string
  uploader: { first_name: string | null; last_name: string | null } | null
}

const FILE_TYPES = [
  { value: 'other', label: 'Other / General' },
  { value: 'insurance', label: 'Insurance / COI' },
  { value: 'license', label: 'License' },
  { value: 'contract', label: 'Contract / W-9' },
  { value: 'photo', label: 'Photo' },
]

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function SubcontractorFiles({ subcontractorId }: { subcontractorId: string }) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [fileType, setFileType] = useState('other')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/files?subcontractor_id=${subcontractorId}`)
      const json = await res.json()
      setFiles(json.data || [])
    } catch {
      toast.error('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [subcontractorId])

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('subcontractor_id', subcontractorId)
      fd.append('file_type', fileType)
      const res = await fetch('/api/files', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Upload failed')
        return
      }
      toast.success('Uploaded')
      load()
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
    }
  }

  async function handleDelete(f: FileRecord) {
    if (!confirm(`Delete ${f.original_name}?`)) return
    const res = await fetch(`/api/files?file_id=${f.id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Delete failed')
      return
    }
    setFiles(files.filter(x => x.id !== f.id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5" /> Documents ({files.length})
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Select
          value={fileType}
          onChange={e => setFileType(e.target.value)}
          options={FILE_TYPES}
          className="max-w-[180px]"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-1" /> Upload File
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="w-4 h-4 mr-1" /> Take Photo
        </Button>
        {uploading && <span className="text-xs text-gray-500">Uploading…</span>}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
        />
      </div>

      {loading ? (
        <p className="text-xs text-gray-500">Loading…</p>
      ) : files.length === 0 ? (
        <p className="text-xs text-gray-400">No documents yet. Upload a file or take a photo of a document.</p>
      ) : (
        <ul className="space-y-1.5">
          {files.map(f => {
            const isImage = f.mime_type?.startsWith('image/')
            return (
              <li key={f.id} className="flex items-center justify-between gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
                <a
                  href={f.public_url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 min-w-0 flex-1 text-sm text-gray-700 hover:text-blue-600"
                >
                  {isImage ? <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" /> : <FileText className="w-4 h-4 text-gray-500 shrink-0" />}
                  <span className="truncate">{f.original_name}</span>
                  {f.file_type && f.file_type !== 'other' && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full capitalize shrink-0">
                      {f.file_type}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 shrink-0">{formatSize(f.size_bytes)}</span>
                </a>
                <div className="flex items-center gap-1 shrink-0">
                  {f.public_url && (
                    <a
                      href={f.public_url}
                      download={f.original_name}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(f)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
