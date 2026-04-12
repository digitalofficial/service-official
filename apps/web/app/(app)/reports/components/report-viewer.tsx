'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { getTemplate } from '@/lib/reports/templates'
import { ReportTable } from './report-table'
import { ExportButton } from './export-button'
import type { ColumnDef, ReportRow, ReportFilters } from '@/lib/reports/types'

interface Props {
  slug: string
}

export function ReportViewer({ slug }: Props) {
  const router = useRouter()
  const template = getTemplate(slug)

  const [filters, setFilters] = useState<ReportFilters>({
    date_from: '',
    date_to: '',
    customer_id: '',
    project_id: '',
    job_id: '',
    status: '',
    group_by: template?.defaultGroupBy ?? '',
  })
  const [projects, setProjects] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [rows, setRows] = useState<ReportRow[]>([])
  const [columns, setColumns] = useState<ColumnDef[]>(template?.columns ?? [])
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [showSave, setShowSave] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ slug })
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to) params.set('date_to', filters.date_to)
      if (filters.customer_id) params.set('customer_id', filters.customer_id)
      if (filters.project_id) params.set('project_id', filters.project_id)
      if (filters.job_id) params.set('job_id', filters.job_id)
      if (filters.status) params.set('status', filters.status)
      if (filters.group_by) params.set('group_by', filters.group_by)

      const res = await fetch(`/api/reports?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setRows(json.data ?? [])
        setColumns(json.columns ?? template?.columns ?? [])
        setSummary(json.summary ?? {})
      }
    } catch (err) {
      console.error('Failed to fetch report:', err)
    } finally {
      setLoading(false)
      setHasFetched(true)
    }
  }, [slug, filters, template])

  useEffect(() => {
    fetchReport()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(d.data || []))
    fetch('/api/jobs').then(r => r.json()).then(d => setJobs(d.data || []))
    fetch('/api/customers').then(r => r.json()).then(d => setCustomers(d.data || []))
  }, [])

  async function handleSave() {
    if (!saveName.trim()) return
    setSaving(true)
    try {
      await fetch('/api/reports/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: saveName.trim(), slug, filters }),
      })
      setShowSave(false)
      setSaveName('')
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!template) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-gray-500">Report template not found.</p>
        <button onClick={() => router.push('/reports?tab=library')} className="mt-3 text-sm text-blue-600 hover:underline">
          Back to Library
        </button>
      </div>
    )
  }

  const hasFilter = (key: string) => template.availableFilters.includes(key as any)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/reports?tab=library')}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{template.name}</h2>
            <p className="text-xs text-gray-500">{template.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton columns={columns} rows={rows} filename={slug} />
          <button
            onClick={() => setShowSave(!showSave)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Report
          </button>
        </div>
      </div>

      {/* Save dialog */}
      {showSave && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Report name..."
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !saveName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => { setShowSave(false); setSaveName('') }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {hasFilter('date_range') && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={filters.date_from ?? ''}
                  onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={filters.date_to ?? ''}
                  onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
          {hasFilter('status') && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={filters.status ?? ''}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          )}
          {hasFilter('customer_id') && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Customer</label>
              <select
                value={filters.customer_id ?? ''}
                onChange={e => setFilters(f => ({ ...f, customer_id: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
              >
                <option value="">All Customers</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.company_name || `${c.first_name} ${c.last_name}`}</option>)}
              </select>
            </div>
          )}
          {hasFilter('project_id') && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Project</label>
              <select
                value={filters.project_id ?? ''}
                onChange={e => setFilters(f => ({ ...f, project_id: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
              >
                <option value="">All Projects</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          {hasFilter('job_id') && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Job</label>
              <select
                value={filters.job_id ?? ''}
                onChange={e => setFilters(f => ({ ...f, job_id: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
              >
                <option value="">All Jobs</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.job_number ? `${j.job_number} — ` : ''}{j.title}</option>)}
              </select>
            </div>
          )}
          {hasFilter('group_by') && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Group By</label>
              <select
                value={filters.group_by ?? ''}
                onChange={e => setFilters(f => ({ ...f, group_by: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="month">Month</option>
                <option value="customer">Customer</option>
                <option value="project">Project</option>
                <option value="job">Job</option>
                <option value="category">Category</option>
              </select>
            </div>
          )}
          <button
            onClick={fetchReport}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Run Report
          </button>
        </div>
      </div>

      {/* Results */}
      {loading && !hasFetched ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="text-xs text-gray-400">{rows.length} row{rows.length !== 1 ? 's' : ''}</div>
          <ReportTable
            columns={columns}
            rows={rows}
            summary={summary}
            showTotals={template.showTotals}
          />
        </>
      )}
    </div>
  )
}
