'use client'

import { useState, useEffect } from 'react'

interface Props {
  name?: string
  defaultValue?: string
  label?: string
}

export function InlineProjectSelect({ name = 'project_id', defaultValue = '', label = 'Project' }: Props) {
  const [projects, setProjects] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState(defaultValue)

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(d.data ?? []))
  }, [])

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <select
        name={name} value={selectedId} onChange={e => setSelectedId(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-400"
      >
        <option value="">No project — standalone</option>
        {projects.map((p: any) => (
          <option key={p.id} value={p.id}>{p.project_number ? `${p.project_number} — ` : ''}{p.name}</option>
        ))}
      </select>
      <p className="text-xs text-gray-400">Optional — leave blank for standalone work</p>
    </div>
  )
}
