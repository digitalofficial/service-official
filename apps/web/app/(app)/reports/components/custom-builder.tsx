'use client'

import { useState, useEffect } from 'react'
import { Loader2, Play, Download } from 'lucide-react'
import { ReportTable } from './report-table'
import { ExportButton } from './export-button'
import type { ColumnDef, ReportRow } from '@/lib/reports/types'

const dataSources = [
  { value: 'invoice-status', label: 'Invoices' },
  { value: 'expense-report', label: 'Expenses' },
  { value: 'job-profitability', label: 'Jobs' },
  { value: 'project-profitability', label: 'Projects' },
  { value: 'estimate-conversion', label: 'Estimates' },
  { value: 'payments-received', label: 'Payments' },
  { value: 'time-labor', label: 'Time Entries' },
  { value: 'customer-revenue', label: 'Customers' },
  { value: 'accounts-payable', label: 'Purchase Orders' },
  { value: 'equipment-utilization', label: 'Equipment' },
] as const

export function CustomBuilder() {
  const [source, setSource] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [projectId, setProjectId] = useState('')
  const [jobId, setJobId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ReportRow[]>([])
  const [columns, setColumns] = useState<ColumnDef[]>([])
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [hasRun, setHasRun] = useState(false)

  const [projects, setProjects] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => setProjects(d.data || []))
    fetch('/api/jobs').then(r => r.json()).then(d => setJobs(d.data || []))
    fetch('/api/customers').then(r => r.json()).then(d => setCustomers(d.data || []))
  }, [])

  async function runQuery() {
    if (!source) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ slug: source })
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      if (projectId) params.set('project_id', projectId)
      if (jobId) params.set('job_id', jobId)
      if (customerId) params.set('customer_id', customerId)
      if (status) params.set('status', status)

      const res = await fetch(`/api/reports?${params.toString()}`)
      const json = await res.json()
      if (res.ok) {
        setRows(json.data ?? [])
        setColumns(json.columns ?? [])
        setSummary(json.summary ?? {})
      }
    } catch (err) {
      console.error('Custom query failed:', err)
    } finally {
      setLoading(false)
      setHasRun(true)
    }
  }

  function exportCsv() {
    if (!columns.length || !rows.length) return
    const header = columns.map(c => c.label).join(',')
    const body = rows.map(row => columns.map(c => {
      const val = row[c.key]
      if (val === null || val === undefined) return ''
      const str = String(val)
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
    }).join(',')).join('\n')
    const blob = new Blob([header + '\n' + body], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `custom-report-${source}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectClass = "px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
  const inputClass = "px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Build a Custom Report</h3>
        <div className="flex flex-wrap gap-3 items-end">
          {/* Data Source */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Data Source</label>
            <select value={source} onChange={e => setSource(e.target.value)} className={selectClass}>
              <option value="">Select...</option>
              {dataSources.map(ds => (
                <option key={ds.value} value={ds.value}>{ds.label}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputClass} />
          </div>

          {/* Project */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Project</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className={selectClass}>
              <option value="">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Job */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Job</label>
            <select value={jobId} onChange={e => setJobId(e.target.value)} className={selectClass}>
              <option value="">All Jobs</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.job_number ? `${j.job_number} — ` : ''}{j.title}</option>)}
            </select>
          </div>

          {/* Customer */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Customer</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={selectClass}>
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.company_name || `${c.first_name} ${c.last_name}`}</option>)}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]">
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

          {/* Run + CSV */}
          <button
            onClick={runQuery}
            disabled={!source || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run
          </button>
          {hasRun && rows.length > 0 && (
            <button
              onClick={exportCsv}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          )}
        </div>
      </div>

      {hasRun && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{rows.length} row{rows.length !== 1 ? 's' : ''}</span>
            {rows.length > 0 && <ExportButton columns={columns} rows={rows} filename="custom-report" />}
          </div>
          <ReportTable columns={columns} rows={rows} summary={summary} showTotals={rows.length > 0} />
        </>
      )}
    </div>
  )
}
