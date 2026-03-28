import { Suspense } from 'react'
import Link from 'next/link'
import { createServerSupabaseClient } from '@service-official/database'
import { getProjects } from '@service-official/database/queries/projects'
import { ProjectStatusBadge } from '@/components/projects/status-badge'
import { ProjectCard } from '@/components/projects/project-card'
import { Button } from '@/components/ui/button'
import { Plus, Search, Filter, LayoutGrid, List } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Projects' }

interface ProjectsPageProps {
  searchParams: { status?: string; search?: string; view?: 'grid' | 'list' }
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()

  const { data: projects, total } = await getProjects({
    organization_id: profile!.organization_id,
    status: searchParams.status,
    search: searchParams.search,
  })

  const statusGroups = [
    { label: 'All', value: undefined },
    { label: 'Estimating', value: 'estimating' },
    { label: 'Approved', value: 'approved' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Punch List', value: 'punch_list' },
    { label: 'Completed', value: 'completed' },
    { label: 'On Hold', value: 'on_hold' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total projects</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-0">
        {statusGroups.map(group => (
          <Link
            key={group.label}
            href={group.value ? `/projects?status=${group.value}` : '/projects'}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              searchParams.status === group.value || (!searchParams.status && !group.value)
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {group.label}
          </Link>
        ))}
      </div>

      {/* Search + Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            defaultValue={searchParams.search}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          Filter
        </button>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button className="p-2 hover:bg-gray-50">
            <LayoutGrid className="w-4 h-4 text-gray-500" />
          </button>
          <button className="p-2 hover:bg-gray-50 border-l border-gray-300">
            <List className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No projects yet</p>
          <p className="text-sm mt-1">Create your first project to get started.</p>
          <Link href="/projects/new">
            <Button className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
