import { getProfile } from '@/lib/auth/get-profile'
import { EmptyState } from '@/components/ui/empty-state'
import { AddItemForm } from '@/components/projects/add-item-form'
import { formatDate } from '@/lib/utils'
import { Clock, CheckCircle, Circle, AlertCircle } from 'lucide-react'
import { PhaseStatusActions, MilestoneToggle } from './timeline-actions'

export const dynamic = 'force-dynamic'

const PHASE_FIELDS = [
  { name: 'name', label: 'Phase Name', type: 'text' as const, placeholder: 'e.g. Demolition', required: true, colSpan: 2 },
  { name: 'description', label: 'Description', type: 'text' as const, placeholder: 'Optional details' , colSpan: 2 },
  { name: 'start_date', label: 'Start Date', type: 'date' as const },
  { name: 'end_date', label: 'End Date', type: 'date' as const },
  { name: 'status', label: 'Status', type: 'select' as const, defaultValue: 'not_started', options: [
    { label: 'Not Started', value: 'not_started' }, { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' }, { label: 'On Hold', value: 'on_hold' },
  ]},
]

const MILESTONE_FIELDS = [
  { name: 'name', label: 'Milestone', type: 'text' as const, placeholder: 'e.g. Framing inspection passed', required: true, colSpan: 2 },
  { name: 'description', label: 'Description', type: 'text' as const, placeholder: 'Optional', colSpan: 2 },
  { name: 'due_date', label: 'Due Date', type: 'date' as const },
]

const PHASE_STATUS_ICON: Record<string, JSX.Element> = {
  not_started: <Circle className="w-4 h-4 text-gray-400" />,
  in_progress: <Clock className="w-4 h-4 text-blue-500" />,
  completed: <CheckCircle className="w-4 h-4 text-green-500" />,
  on_hold: <AlertCircle className="w-4 h-4 text-amber-500" />,
}

export default async function ProjectTimelinePage({ params }: { params: { id: string } }) {
  const { supabase } = await getProfile()
  const [{ data: phases }, { data: milestones }] = await Promise.all([
    supabase.from('project_phases').select('*').eq('project_id', params.id).order('order_index', { ascending: true }),
    supabase.from('project_milestones').select('*').eq('project_id', params.id).order('due_date', { ascending: true }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Phases ({phases?.length ?? 0})</h2>
          <AddItemForm projectId={params.id} itemType="phase" buttonLabel="Add Phase" formTitle="New Phase" fields={PHASE_FIELDS} />
        </div>
        {!phases || phases.length === 0 ? (
          <EmptyState icon={<Clock className="w-10 h-10" />} title="No phases yet" description="Break your project into phases to track progress." />
        ) : (
          <div className="space-y-2">
            {phases.map((phase: any, i: number) => (
              <div key={phase.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-gray-400 w-6 text-center">{i + 1}</span>
                  {PHASE_STATUS_ICON[phase.status] ?? PHASE_STATUS_ICON.not_started}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900">{phase.name}</h3>
                  {phase.description && <p className="text-xs text-gray-500 mt-0.5">{phase.description}</p>}
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    {phase.start_date && <span>{formatDate(phase.start_date, { month: 'short', day: 'numeric' })}</span>}
                    {phase.start_date && phase.end_date && <span>—</span>}
                    {phase.end_date && <span>{formatDate(phase.end_date, { month: 'short', day: 'numeric' })}</span>}
                  </div>
                </div>
                <PhaseStatusActions phaseId={phase.id} currentStatus={phase.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Milestones ({milestones?.length ?? 0})</h2>
          <AddItemForm projectId={params.id} itemType="milestone" buttonLabel="Add Milestone" formTitle="New Milestone" fields={MILESTONE_FIELDS} />
        </div>
        {milestones && milestones.length > 0 ? (
          <div className="space-y-2">
            {milestones.map((ms: any) => (
              <div key={ms.id} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
                {ms.is_completed ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  : <Circle className="w-4 h-4 text-gray-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${ms.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{ms.name}</p>
                  {ms.description && <p className="text-xs text-gray-500 mt-0.5">{ms.description}</p>}
                </div>
                {ms.due_date && <span className="text-xs text-gray-400 shrink-0">{formatDate(ms.due_date, { month: 'short', day: 'numeric' })}</span>}
                <MilestoneToggle milestoneId={ms.id} isCompleted={ms.is_completed ?? false} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<CheckCircle className="w-10 h-10" />} title="No milestones yet" description="Add key milestones to track important dates." />
        )}
      </div>
    </div>
  )
}
