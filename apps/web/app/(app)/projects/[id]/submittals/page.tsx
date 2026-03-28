import { createServerSupabaseClient } from '@service-official/database'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, statusColor } from '@/lib/utils'
import { Plus, Send, FileText } from 'lucide-react'

export default async function SubmittalsPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: submittals } = await supabase
    .from('submittals')
    .select('*')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Submittals ({submittals?.length ?? 0})</h2>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" />New Submittal</Button>
      </div>

      {!submittals || submittals.length === 0 ? (
        <EmptyState
          icon={<Send className="w-10 h-10" />}
          title="No submittals"
          description="Track product approvals and shop drawing submittals."
          action={<Button size="sm"><Plus className="w-4 h-4 mr-1" />Submit</Button>}
        />
      ) : (
        <div className="space-y-2">
          {submittals.map((sub: any) => {
            const colors = statusColor(sub.status)
            return (
              <div key={sub.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
                <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900">{sub.title}</h3>
                  {sub.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{sub.description}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(sub.created_at, { month: 'short', day: 'numeric' })}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${colors.bg} ${colors.text}`}>
                  {sub.status.replace(/_/g, ' ')}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
