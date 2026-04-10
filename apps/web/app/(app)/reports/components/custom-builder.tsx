'use client'

import { useState } from 'react'
import { Loader2, Play } from 'lucide-react'
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
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ReportRow[]>([])
  const [columns, setColumns] = useState<ColumnDef[]>([])
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [hasRun, setHasRun] = useState(false)

  async function runQuery() {
    if (!source) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ slug: source })
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)

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

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Build a Custom Report</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Data Source</label>
            <select
              value={source}
              onChange={e => setSource(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
            >
              <option value="">Select...</option>
              {dataSources.map(ds => (
                <option key={ds.value} value={ds.value}>{ds.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={runQuery}
            disabled={!source || loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run
          </button>
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
