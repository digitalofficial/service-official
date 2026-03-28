import { createServerSupabaseClient } from '@service-official/database'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate } from '@/lib/utils'
import { Plus, Camera, Download, Eye } from 'lucide-react'

export default async function ProjectPhotosPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: photos } = await supabase
    .from('photos')
    .select('*, uploader:profiles!uploaded_by(first_name, last_name)')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Photos ({photos?.length ?? 0})</h2>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" />Upload Photos</Button>
      </div>

      {!photos || photos.length === 0 ? (
        <EmptyState
          icon={<Camera className="w-10 h-10" />}
          title="No photos yet"
          description="Upload before/after and progress photos."
          action={<Button size="sm"><Plus className="w-4 h-4 mr-1" />Upload</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((photo: any) => (
            <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-gray-200">
              <div className="aspect-square bg-gray-100">
                <img src={photo.thumbnail_url ?? photo.public_url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <a href={photo.public_url} target="_blank" rel="noopener" className="p-2 bg-white rounded-full hover:bg-gray-100">
                  <Eye className="w-4 h-4 text-gray-700" />
                </a>
                <a href={photo.public_url} download className="p-2 bg-white rounded-full hover:bg-gray-100">
                  <Download className="w-4 h-4 text-gray-700" />
                </a>
              </div>
              {(photo.is_before || photo.is_after) && (
                <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded ${photo.is_before ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                  {photo.is_before ? 'Before' : 'After'}
                </span>
              )}
              {photo.caption && (
                <div className="p-2">
                  <p className="text-xs text-gray-700 truncate">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
