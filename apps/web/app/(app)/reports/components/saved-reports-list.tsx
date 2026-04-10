'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Trash2, Loader2, Bookmark } from 'lucide-react'
import { reportTemplates } from '@/lib/reports/templates'
import type { SavedReport } from '@/lib/reports/types'

export function SavedReportsList() {
  const router = useRouter()
  const [reports, setReports] = useState<SavedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchSaved()
  }, [])

  async function fetchSaved() {
    try {
      const res = await fetch('/api/reports/saved')
      const json = await res.json()
      setReports(json.data ?? [])
    } catch {
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await fetch(`/api/reports/saved/${id}`, { method: 'DELETE' })
      setReports(r => r.filter(x => x.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setDeleting(null)
    }
  }

  function runReport(report: SavedReport) {
    const params = new URLSearchParams({ tab: 'library', slug: report.slug })
    router.push(`/reports?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <Bookmark className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-gray-900 mb-1">No Saved Reports</h3>
        <p className="text-xs text-gray-500">Run a report from the library and click &quot;Save Report&quot; to save it here.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Template</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Created</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.map(report => {
              const template = reportTemplates.find(t => t.slug === report.slug)
              return (
                <tr key={report.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{report.name}</td>
                  <td className="px-4 py-3 text-gray-600">{template?.name ?? report.slug}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => runReport(report)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Run report"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(report.id)}
                        disabled={deleting === report.id}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deleting === report.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
