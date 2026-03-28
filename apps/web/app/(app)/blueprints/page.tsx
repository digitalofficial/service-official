import { createServerSupabaseClient } from '@service-official/database'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, formatBytes } from '@/lib/utils'
import { Plus, Map, FileText, Eye, Cpu } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Blueprints' }

export default async function BlueprintsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()

  const { data: blueprints } = await supabase
    .from('blueprints')
    .select(`
      *,
      project:projects(id, name),
      uploader:profiles!uploaded_by(first_name, last_name)
    `)
    .eq('organization_id', profile!.organization_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blueprints"
        description={`${blueprints?.length ?? 0} total blueprints`}
        actions={<Button><Plus className="w-4 h-4 mr-2" />Upload Blueprint</Button>}
      />

      {!blueprints || blueprints.length === 0 ? (
        <EmptyState
          icon={<Map className="w-12 h-12" />}
          title="No blueprints yet"
          description="Upload your first blueprint to start AI-powered takeoffs."
          action={<Button><Plus className="w-4 h-4 mr-2" />Upload Blueprint</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blueprints.map((bp: any) => (
            <div key={bp.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all">
              {/* Preview */}
              <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative">
                {bp.public_url ? (
                  <img src={bp.public_url} alt={bp.name} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-12 h-12 text-gray-300" />
                )}
                {bp.page_count && (
                  <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
                    {bp.page_count} pages
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{bp.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  {bp.project && <span>{bp.project.name}</span>}
                  {bp.version && <span>v{bp.version}</span>}
                  {bp.discipline && <span className="capitalize">{bp.discipline}</span>}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  {bp.uploader && <span>{bp.uploader.first_name} {bp.uploader.last_name}</span>}
                  <span>{formatDate(bp.created_at, { month: 'short', day: 'numeric' })}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <Button variant="ghost" size="sm"><Eye className="w-3.5 h-3.5 mr-1" />View</Button>
                  <Link href={`/takeoffs?blueprint_id=${bp.id}`}>
                    <Button variant="ghost" size="sm"><Cpu className="w-3.5 h-3.5 mr-1" />Takeoff</Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
