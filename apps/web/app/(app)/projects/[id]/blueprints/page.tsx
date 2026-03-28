import { createServerSupabaseClient } from '@service-official/database'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate } from '@/lib/utils'
import { Plus, Map, Eye, Cpu, FileText } from 'lucide-react'
import Link from 'next/link'

export default async function ProjectBlueprintsPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: blueprints } = await supabase
    .from('blueprints')
    .select('*, uploader:profiles!uploaded_by(first_name, last_name)')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Blueprints ({blueprints?.length ?? 0})</h2>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" />Upload Blueprint</Button>
      </div>

      {!blueprints || blueprints.length === 0 ? (
        <EmptyState
          icon={<Map className="w-10 h-10" />}
          title="No blueprints yet"
          description="Upload plans to enable AI-powered takeoffs."
          action={<Button size="sm"><Plus className="w-4 h-4 mr-1" />Upload</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blueprints.map((bp: any) => (
            <div key={bp.id} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
              <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                {bp.public_url ? (
                  <img src={bp.public_url} alt={bp.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <FileText className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900">{bp.name}</h3>
                <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                  {bp.version && <p>Version {bp.version}</p>}
                  {bp.discipline && <p className="capitalize">{bp.discipline}</p>}
                  {bp.page_count && <p>{bp.page_count} pages</p>}
                  <p>{formatDate(bp.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button variant="ghost" size="sm"><Eye className="w-3.5 h-3.5 mr-1" />View</Button>
                  <Link href={`/takeoffs?blueprint_id=${bp.id}&project_id=${params.id}`}>
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
