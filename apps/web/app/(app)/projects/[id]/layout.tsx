import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProfile } from '@/lib/auth/get-profile'
import { getProjectById } from '@service-official/database/queries/projects'
import { TabLink } from '@/components/projects/tab-link'

export const dynamic = 'force-dynamic'
import { ProjectStatusBadge } from '@/components/projects/status-badge'
import { ArrowLeft, MapPin, Calendar, DollarSign, Users } from 'lucide-react'

const PROJECT_TABS = [
  { label: 'Overview', href: '' },
  { label: 'Schedule', href: '/schedule' },
  { label: 'Budget', href: '/budget' },
  { label: 'Files', href: '/files' },
  { label: 'Photos', href: '/photos' },
  { label: 'Blueprints', href: '/blueprints' },
  { label: 'Timeline', href: '/timeline' },
  { label: 'Team', href: '/team' },
  { label: 'Expenses', href: '/expenses' },
  { label: 'Materials', href: '/materials' },
  { label: 'Daily Logs', href: '/daily-logs' },
  { label: 'Punch List', href: '/punch-list' },
  { label: 'RFIs', href: '/rfis' },
  { label: 'Change Orders', href: '/change-orders' },
  { label: 'Submittals', href: '/submittals' },
  { label: 'Inspections', href: '/inspections' },
  { label: 'Safety', href: '/safety' },
]

interface ProjectLayoutProps {
  children: React.ReactNode
  params: { id: string }
}

export default async function ProjectDetailLayout({ children, params }: ProjectLayoutProps) {
  await getProfile()
  const project = await getProjectById(params.id)
  if (!project) notFound()

  const baseHref = `/projects/${params.id}`

  return (
    <div className="space-y-0 -m-6">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200 px-6 pt-6 pb-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/projects" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                <ProjectStatusBadge status={project.status} />
                {project.project_number && (
                  <span className="text-sm text-gray-400">{project.project_number}</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {project.customer && (
                  <span>{project.customer.first_name} {project.customer.last_name ?? project.customer.company_name}</span>
                )}
                {project.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {project.city}, {project.state}
                  </span>
                )}
                {project.contract_value && (
                  <span className="flex items-center gap-1 font-medium text-gray-700">
                    <DollarSign className="w-3 h-3" />
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(project.contract_value)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              Edit
            </button>
            <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create Invoice
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-0 overflow-x-auto">
          {PROJECT_TABS.map(tab => (
            <TabLink
              key={tab.label}
              href={tab.href ? `${baseHref}${tab.href}` : `${baseHref}/overview`}
              label={tab.label}
            />
          ))}
        </div>
      </div>

      {/* Page Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
