'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Image, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { formatBytes } from '@/lib/utils'
import { cn } from '@/lib/utils/cn'

interface UploadedFile {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  result?: any
}

interface FileUploadProps {
  projectId?: string
  jobId?: string
  customerId?: string
  fileType?: string
  accept?: Record<string, string[]>
  maxFiles?: number
  maxSize?: number
  onUploadComplete?: (files: any[]) => void
  label?: string
  description?: string
  isPublic?: boolean
}

export function FileUpload({
  projectId,
  jobId,
  customerId,
  fileType = 'other',
  accept,
  maxFiles = 20,
  maxSize = 50 * 1024 * 1024,
  onUploadComplete,
  label = 'Upload files',
  description = 'Drag & drop files here, or click to browse',
  isPublic = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)

  const defaultAccept = accept ?? {
    'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0,
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: defaultAccept,
    maxFiles,
    maxSize,
  })

  const uploadFiles = async () => {
    setUploading(true)
    const results: any[] = []

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'success') continue

      setFiles(prev => prev.map((f, idx) =>
        idx === i ? { ...f, status: 'uploading', progress: 0 } : f
      ))

      try {
        const formData = new FormData()
        formData.append('file', files[i].file)
        if (projectId) formData.append('project_id', projectId)
        if (jobId) formData.append('job_id', jobId)
        if (customerId) formData.append('customer_id', customerId)
        formData.append('file_type', fileType)
        formData.append('is_public', String(isPublic))

        const response = await fetch('/api/files', { method: 'POST', body: formData })
        const data = await response.json()

        if (response.ok) {
          setFiles(prev => prev.map((f, idx) =>
            idx === i ? { ...f, status: 'success', progress: 100, result: data.data } : f
          ))
          results.push(data.data)
        } else {
          throw new Error(data.error ?? 'Upload failed')
        }
      } catch (err: any) {
        setFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'error', error: err.message } : f
        ))
      }
    }

    setUploading(false)
    if (results.length > 0) onUploadComplete?.(results)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const pendingCount = files.filter(f => f.status === 'pending').length

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className={cn('w-8 h-8 mx-auto mb-3', isDragActive ? 'text-blue-500' : 'text-gray-400')} />
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
        <p className="text-xs text-gray-400 mt-1">Max {formatBytes(maxSize)} per file</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              {uploadedFile.file.type.startsWith('image/') ? (
                <Image className="w-4 h-4 text-blue-500 shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{uploadedFile.file.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(uploadedFile.file.size)}</p>
                {uploadedFile.status === 'uploading' && (
                  <div className="h-1 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                )}
                {uploadedFile.status === 'error' && (
                  <p className="text-xs text-red-500 mt-0.5">{uploadedFile.error}</p>
                )}
              </div>

              <div className="shrink-0">
                {uploadedFile.status === 'pending' && (
                  <button onClick={() => removeFile(index)} className="p-1 hover:bg-gray-200 rounded">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
                {uploadedFile.status === 'uploading' && (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                )}
                {uploadedFile.status === 'success' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {uploadedFile.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {pendingCount > 0 && (
        <button
          onClick={uploadFiles}
          disabled={uploading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
            </>
          )}
        </button>
      )}
    </div>
  )
}
