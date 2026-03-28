'use client'

import Link from 'next/link'
import { MapPin, Calendar, DollarSign, Users, ChevronRight } from 'lucide-react'
import { statusColor, formatCurrency, formatDate } from '@/lib/utils'
import type { Project } from '@service-official/types'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const colors = statusColor(project.status)
  const progress = project.phases?.length
    ? Math.round((project.phases.filter(p => p.status === 'completed').length / project.phases.length) * 100)
    : null

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {project.name}
            </h3>
            {project.project_number && (
              <p className="text-xs text-gray-400 mt-0.5">{project.project_number}</p>
            )}
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${colors.bg} ${colors.text}`}>
            {project.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Customer */}
        {project.customer && (
          <p className="text-sm text-gray-600 mb-3">
            {project.customer.first_name} {project.customer.last_name ?? project.customer.company_name}
          </p>
        )}

        {/* Meta */}
        <div className="space-y-1.5 mb-4">
          {(project.city || project.state) && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              {project.city}{project.state ? `, ${project.state}` : ''}
            </div>
          )}
          {project.estimated_start_date && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              {formatDate(project.estimated_start_date)}
              {project.estimated_end_date && <> → {formatDate(project.estimated_end_date)}</>}
            </div>
          )}
          {project.contract_value != null && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <DollarSign className="w-3 h-3" />
              {formatCurrency(project.contract_value)}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {progress !== null && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {project.project_manager && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                  {project.project_manager.first_name?.[0]}
                </div>
                <span>{project.project_manager.first_name}</span>
              </div>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
        </div>
      </div>
    </Link>
  )
}
