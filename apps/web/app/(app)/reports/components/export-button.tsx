'use client'

import { Download } from 'lucide-react'
import type { ColumnDef, ReportRow } from '@/lib/reports/types'

interface Props {
  columns: ColumnDef[]
  rows: ReportRow[]
  filename?: string
}

export function ExportButton({ columns, rows, filename = 'report' }: Props) {
  function exportCSV() {
    const header = columns.map(c => c.label).join(',')
    const csvRows = rows.map(row =>
      columns.map(col => {
        const val = row[col.key]
        if (val === null || val === undefined) return ''
        const str = String(val)
        // Escape quotes and wrap in quotes if contains comma/quote/newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(',')
    )
    const csv = [header, ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={exportCSV}
      disabled={rows.length === 0}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  )
}
