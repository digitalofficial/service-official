import { getProfile } from '@/lib/auth/get-profile'
import { EmptyState } from '@/components/ui/empty-state'
import { AddItemForm } from '@/components/projects/add-item-form'
import { ItemActions } from '@/components/projects/item-actions'
import { formatDate, statusColor } from '@/lib/utils'
import { Send, FileText } from 'lucide-react'

const SUBMITTAL_STATUSES = [
  { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In Review' }, { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }, { value: 'resubmit', label: 'Resubmit' },
]

const FIELDS = [
  { name: 'title', label: 'Title', type: 'text' as const, placeholder: 'e.g. Shingle color samples', required: true, colSpan: 2 },
  { name: 'description', label: 'Description', type: 'textarea' as const, placeholder: 'Details about what is being submitted...', colSpan: 2 },
  { name: 'spec_section', label: 'Spec Section', type: 'text' as const, placeholder: 'e.g. 07310 - Asphalt Shingles' },
  { name: 'due_date', label: 'Due Date', type: 'date' as const },
]

export default async function SubmittalsPage({ params }: { params: { id: string } }) {
  const { supabase } = await getProfile()
  const { data: submittals } = await supabase.from('submittals').select('*').eq('project_id', params.id).order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Submittals ({submittals?.length ?? 0})</h2>
        <AddItemForm projectId={params.id} itemType="submittal" buttonLabel="New Submittal" formTitle="New Submittal" fields={FIELDS} />
      </div>
      {!submittals || submittals.length === 0 ? (
        <EmptyState icon={<Send className="w-10 h-10" />} title="No submittals" description="Track product approvals and shop drawing submittals."
          action={<AddItemForm projectId={params.id} itemType="submittal" buttonLabel="Submit" formTitle="New Submittal" fields={FIELDS} />} />
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
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${colors.bg} ${colors.text}`}>{sub.status.replace(/_/g, ' ')}</span>
                <ItemActions itemId={sub.id} itemType="submittal" currentStatus={sub.status} statuses={SUBMITTAL_STATUSES} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
