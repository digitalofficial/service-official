import { getProjectById, getProjectStats } from '@service-official/database/queries/projects'
import { notFound } from 'next/navigation'
import { ProjectPhaseTimeline } from '@/components/projects/phase-timeline'
import { ProjectStatsCards } from '@/components/projects/stats-cards'
import { RecentActivity } from '@/components/projects/recent-activity'
import { ProjectTeamPanel } from '@/components/projects/team-panel'
import { MaterialsStatus } from '@/components/projects/materials-status'

export default async function ProjectOverviewPage({ params }: { params: { id: string } }) {
  const [project, stats] = await Promise.all([
    getProjectById(params.id),
    getProjectStats(params.id),
  ])

  if (!project) notFound()

  const progress = project.phases?.length
    ? Math.round((project.phases.filter(p => p.status === 'completed').length / project.phases.length) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard label="Contract Value" value={fmt(project.contract_value)} />
        <StatCard label="Actual Cost" value={fmt(stats.actual_cost)} color={stats.actual_cost > (project.contract_value || 0) ? 'red' : 'default'} />
        <StatCard label="Expenses" value={fmt(stats.total_expenses)} />
        <StatCard label="Change Orders" value={fmt(stats.approved_change_orders)} />
        <StatCard label="Photos" value={String(stats.photo_count)} />
        <StatCard label="Open Items" value={String(stats.open_punch_items)} color={stats.open_punch_items > 0 ? 'amber' : 'green'} />
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Project Progress</h3>
          <span className="text-sm font-medium text-blue-600">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {project.estimated_start_date && project.estimated_end_date && (
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{project.estimated_start_date}</span>
            <span>{project.estimated_end_date}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phases / Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Phases & Milestones</h3>
          {project.phases && project.phases.length > 0 ? (
            <div className="space-y-3">
              {project.phases.map(phase => (
                <PhaseRow key={phase.id} phase={phase} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">No phases defined yet</p>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Project Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Details</h3>
            <DetailRow label="Status" value={project.status.replace(/_/g, ' ')} />
            <DetailRow label="Project Manager" value={`${project.project_manager?.first_name ?? ''} ${project.project_manager?.last_name ?? ''}`.trim() || '—'} />
            <DetailRow label="Foreman" value={`${project.foreman?.first_name ?? ''} ${project.foreman?.last_name ?? ''}`.trim() || '—'} />
            {project.permit_number && <DetailRow label="Permit #" value={project.permit_number} />}
            {project.roof_type && <DetailRow label="Roof Type" value={project.roof_type} />}
            {project.roof_squares && <DetailRow label="Squares" value={`${project.roof_squares} sq`} />}
          </div>

          {/* Open Items Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="font-semibold text-gray-900">Open Items</h3>
            <OpenItemRow label="Punch List" count={stats.open_punch_items} href={`/projects/${params.id}/punch-list`} />
            <OpenItemRow label="RFIs" count={stats.open_rfis} href={`/projects/${params.id}/rfis`} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'default' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color === 'amber' ? 'text-amber-600' : color === 'green' ? 'text-green-600' : color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </p>
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
  const statusColors = {
    not_started: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    on_hold: 'bg-amber-100 text-amber-700',
  }
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${phase.status === 'completed' ? 'bg-green-500' : phase.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'}`} />
        <span className="text-sm font-medium text-gray-700">{phase.name}</span>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[phase.status as keyof typeof statusColors]}`}>
        {phase.status.replace(/_/g, ' ')}
      </span>
    </div>
  )
}

function OpenItemRow({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <a href={href} className={`font-semibold ${count > 0 ? 'text-amber-600 hover:text-amber-700' : 'text-gray-400'}`}>
        {count}
      </a>
    </div>
  )
}

function fmt(value?: number | null) {
  if (!value) return '$0'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}
