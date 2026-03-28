'use client'

import { FileText, Image, Download, Eye, MoreHorizontal, Trash2 } from 'lucide-react'
import { formatBytes, formatDate } from '@/lib/utils'
import type { FileRecord } from '@service-official/types'

interface FileGridProps {
  files: any[]
  onDelete?: (id: string) => void
}

export function FileGrid({ files, onDelete }: FileGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {files.map(file => (
        <FileCard key={file.id} file={file} onDelete={onDelete} />
      ))}
    </div>
  )
}

function FileCard({ file, onDelete }: { file: any; onDelete?: (id: string) => void }) {
  const isImage = file.mime_type?.startsWith('image/')

  return (
    <div className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all">
      {/* Preview */}
      <div className="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
        {isImage && file.public_url ? (
          <img
            src={file.thumbnail_url ?? file.public_url}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-gray-300" />
            <span className="text-xs font-bold text-gray-400 uppercase">
              {file.original_name?.split('.').pop()}
            </span>
          </div>
        )}

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {file.public_url && (
            <a
              href={file.public_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
              title="View"
            >
              <Eye className="w-4 h-4 text-gray-700" />
            </a>
          )}
          {file.public_url && (
            <a
              href={file.public_url}
              download={file.original_name}
              className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4 text-gray-700" />
            </a>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(file.id)}
              className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-xs font-medium text-gray-800 truncate" title={file.original_name}>
          {file.original_name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-400">{formatBytes(file.size_bytes ?? 0)}</p>
          {file.is_public && (
            <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-medium">Public</span>
          )}
        </div>
        {file.uploader && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {file.uploader.first_name} · {formatDate(file.created_at, { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>
    </div>
  )
}
