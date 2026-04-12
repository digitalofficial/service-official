import { getProjectById, getProjectStats } from '@service-official/database/queries/projects'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PhaseActions } from './phase-actions'

export const dynamic = 'force-dynamic'

export default async function ProjectOverviewPage({ params }: { params: { id: string } }) {
  const [project, stats] = await Promise.all([
    getProjectById(params.id),
    getProjectStats(params.id),
  ])

  if (!project) notFound()

  const phases = project.phases ?? []
  const milestones = project.milestones ?? []
  const completedPhases = phases.filter(p => p.status === 'completed').length
  // Use schedule task average if tasks exist, otherwise fall back to phase completion
  const progress = stats.total_schedule_tasks > 0
    ? stats.schedule_progress
    : phases.length ? Math.round((completedPhases / phases.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Financial Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Contract Value" value={fmt(project.contract_value)} />
        <StatCard label="Actual Cost" value={fmt(stats.actual_cost)} color={stats.actual_cost > (project.contract_value || 0) ? 'red' : 'default'} />
        <StatCard label="Expenses" value={fmt(stats.total_expenses)} sub={stats.pending_expenses > 0 ? `${stats.pending_expenses} pending` : undefined} />
        <StatCard label="Materials" value={fmt(stats.total_materials)} sub={stats.materials_pending > 0 ? `${stats.materials_pending} pending` : undefined} />
        <StatCard label="Labor" value={`${stats.total_labor_hours}h`} sub={fmt(stats.total_labor_cost)} />
        <StatCard label="Change Orders" value={fmt(stats.approved_change_orders)} sub={stats.pending_change_orders > 0 ? `${stats.pending_change_orders} pending` : undefined} />
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Project Progress</h3>
          <span className="text-sm font-medium text-blue-600">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {project.estimated_start_date && project.estimated_end_date && (
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{project.estimated_start_date}</span>
            <span>{project.estimated_end_date}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phases & Milestones */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Phases ({completedPhases}/{phases.length} complete)</h3>
            </div>
            {phases.length > 0 ? (
              <div className="space-y-2">
                {phases.map(phase => (
                  <PhaseRow key={phase.id} phase={phase} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">No phases defined yet</p>
            )}
          </div>

          {stats.schedule_tasks.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Schedule Tasks ({stats.schedule_progress}% avg)</h3>
              <div className="space-y-2">
                {stats.schedule_tasks.map((task: any) => (
                  <div key={task.name} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-gray-700">{task.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${task.progress >= 100 ? 'bg-green-500' : task.progress > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: `${Math.min(task.progress, 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{task.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {milestones.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Milestones</h3>
              <div className="space-y-2">
                {milestones.map((ms: any) => (
                  <div key={ms.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${ms.is_completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={`text-sm font-medium ${ms.is_completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{ms.name}</span>
                    </div>
                    {ms.target_date && (
                      <span className="text-xs text-gray-400">{ms.target_date}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Project Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Details</h3>
            <DetailRow label="Status" value={project.status.replace(/_/g, ' ')} />
            <DetailRow label="Project Manager" value={`${project.project_manager?.first_name ?? ''} ${project.project_manager?.last_name ?? ''}`.trim() || '—'} />
            <DetailRow label="Foreman" value={`${project.foreman?.first_name ?? ''} ${project.foreman?.last_name ?? ''}`.trim() || '—'} />
            {project.permit_number && <DetailRow label="Permit #" value={project.permit_number} />}
          </div>

          {/* Items Tracker */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="font-semibold text-gray-900">Items Tracker</h3>
            <TrackerRow label="Punch List" open={stats.open_punch_items} total={stats.total_punch_items} href={`/projects/${params.id}/punch-list`} />
            <TrackerRow label="RFIs" open={stats.open_rfis} total={stats.total_rfis} href={`/projects/${params.id}/rfis`} />
            <TrackerRow label="Change Orders" open={stats.pending_change_orders} total={stats.total_change_orders} href={`/projects/${params.id}/change-orders`} />
            <TrackerRow label="Submittals" open={stats.pending_submittals} total={stats.total_submittals} href={`/projects/${params.id}/submittals`} />
            <TrackerRow label="Materials" open={stats.materials_pending} total={stats.total_materials_count} href={`/projects/${params.id}/materials`} />
            <TrackerRow label="Inspections" open={stats.pending_inspections} total={stats.total_inspections} href={`/projects/${params.id}/inspections`} />
            <TrackerRow label="Purchase Orders" open={stats.open_pos} total={stats.total_pos} href="/purchase-orders" />
          </div>

          {/* Activity Counts */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="font-semibold text-gray-900">Activity</h3>
            <CountRow label="Photos" count={stats.photo_count} href={`/projects/${params.id}/photos`} />
            <CountRow label="Files" count={stats.file_count} href={`/projects/${params.id}/files`} />
            <CountRow label="Daily Logs" count={stats.daily_log_count} href={`/projects/${params.id}/daily-logs`} />
            <CountRow label="Expenses" count={stats.total_expenses_count} href={`/projects/${params.id}/expenses`} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'default', sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color === 'amber' ? 'text-amber-600' : color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 capitalize">{value}</span>
    </div>
  )
}

function PhaseRow({ phase }: { phase: any }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${phase.status === 'completed' ? 'bg-green-500' : phase.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'}`} />
        <div>
          <span className="text-sm font-medium text-gray-700">{phase.name}</span>
          {phase.start_date && phase.end_date && (
            <p className="text-xs text-gray-400">{phase.start_date} — {phase.end_date}</p>
          )}
        </div>
      </div>
      <PhaseActions phaseId={phase.id} currentStatus={phase.status} />
    </div>
  )
}

function TrackerRow({ label, open, total, href }: { label: string; open: number; total: number; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between text-sm py-1 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        {open > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">{open} open</span>}
        <span className="text-gray-400 text-xs">{total} total</span>
      </div>
    </Link>
  )
}

function CountRow({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between text-sm py-1 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{count}</span>
    </Link>
  )
}

function fmt(value?: number | null) {
  if (!value) return '$0'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}
