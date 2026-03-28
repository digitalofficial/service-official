import { createServerSupabaseClient } from '@service-official/database'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, statusColor } from '@/lib/utils'
import { Plus, HelpCircle, MessageSquare } from 'lucide-react'

export default async function ProjectRFIsPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: rfis } = await supabase
    .from('rfis')
    .select('*, submitter:profiles!submitted_by(first_name, last_name), answerer:profiles!answered_by(first_name, last_name)')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">RFIs ({rfis?.length ?? 0})</h2>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" />New RFI</Button>
      </div>

      {!rfis || rfis.length === 0 ? (
        <EmptyState
          icon={<HelpCircle className="w-10 h-10" />}
          title="No RFIs"
          description="Requests for information will appear here."
          action={<Button size="sm"><Plus className="w-4 h-4 mr-1" />Submit RFI</Button>}
        />
      ) : (
        <div className="space-y-2">
          {rfis.map((rfi: any) => {
            const colors = statusColor(rfi.status)
            return (
              <div key={rfi.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      {rfi.rfi_number && <span className="text-xs text-gray-400">{rfi.rfi_number}</span>}
                      <h3 className="text-sm font-medium text-gray-900">{rfi.title}</h3>
                    </div>
                    {rfi.discipline && <p className="text-xs text-gray-500 capitalize mt-0.5">{rfi.discipline}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${colors.bg} ${colors.text}`}>
                    {rfi.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{rfi.question}</p>
                {rfi.answer && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                    <p className="text-xs font-medium text-green-700 mb-0.5">Answer</p>
                    <p className="text-sm text-green-800">{rfi.answer}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  {rfi.submitter && <span>By {rfi.submitter.first_name} {rfi.submitter.last_name}</span>}
                  <span>{formatDate(rfi.created_at, { month: 'short', day: 'numeric' })}</span>
                  {rfi.due_date && <span>Due {formatDate(rfi.due_date, { month: 'short', day: 'numeric' })}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
