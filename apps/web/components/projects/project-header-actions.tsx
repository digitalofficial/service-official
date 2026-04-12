'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EditProjectModal } from './edit-project-modal'

export function ProjectHeaderActions({ project }: { project: any }) {
  const [editOpen, setEditOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setEditOpen(true)}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          Edit
        </button>
        <Link
          href={`/invoices/new?project_id=${project.id}&customer_id=${project.customer_id || ''}`}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Invoice
        </Link>
      </div>

      <EditProjectModal project={project} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  )
}
