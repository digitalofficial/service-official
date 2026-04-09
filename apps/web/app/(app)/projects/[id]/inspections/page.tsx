'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ClipboardCheck, Plus, CheckCircle2, XCircle } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
}

export default function ProjectInspectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const [inspections, setInspections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/inspections?project_id=${projectId}`)
      .then(r => r.json())
      .then(d => { setInspections(d.data || []); setLoading(false) })
  }, [projectId])

  if (loading) return <div className="animate-pulse"><div className="h-48 bg-gray-100 rounded-lg" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Inspections</h2>
        <Link href={`/inspections?project_id=${projectId}`}>
          <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-1.5" />New Inspection</Button>
        </Link>
      </div>

      {inspections.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No inspections for this project yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map(insp => (
            <Link key={insp.id} href={`/inspections/${insp.id}`} className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{insp.title}</h3>
                  <p className="text-xs text-gray-500">{insp.inspection_number} {insp.scheduled_date && `— ${insp.scheduled_date}`}</p>
                </div>
                <div className="flex items-center gap-3">
                  {insp.overall_result && (
                    <span className="flex items-center gap-1 text-sm">
                      {insp.overall_result === 'pass' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                      {insp.pass_count}/{insp.total_items}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[insp.status] || ''}`}>
                    {insp.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
