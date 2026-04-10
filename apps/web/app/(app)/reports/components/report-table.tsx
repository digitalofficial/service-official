'use client'

import { useState, useMemo } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { ColumnDef, ReportRow } from '@/lib/reports/types'

interface Props {
  columns: ColumnDef[]
  rows: ReportRow[]
  summary?: Record<string, number>
  showTotals?: boolean
}

function formatCell(value: any, format: ColumnDef['format']): string {
  if (value === null || value === undefined || value === '') return '-'
  switch (format) {
    case 'currency':
      return formatCurrency(Number(value))
    case 'number':
      return Number(value).toLocaleString()
    case 'percent':
      return `${Number(value).toFixed(1)}%`
    case 'date':
      if (!value) return '-'
      try {
        return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      } catch {
        return String(value)
      }
    case 'status':
      return String(value).replace(/_/g, ' ')
    default:
      return String(value)
  }
}

function StatusBadge({ value }: { value: string }) {
  const label = value.replace(/_/g, ' ')
  const colors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700',
    completed: 'bg-green-100 text-green-700',
    succeeded: 'bg-green-100 text-green-700',
    approved: 'bg-green-100 text-green-700',
    active: 'bg-green-100 text-green-700',
    sent: 'bg-blue-100 text-blue-700',
    draft: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
    partial: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    canceled: 'bg-red-100 text-red-700',
    declined: 'bg-red-100 text-red-700',
    converted: 'bg-purple-100 text-purple-700',
  }
  const cls = colors[value] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {label}
    </span>
  )
}

export function ReportTable({ columns, rows, summary, showTotals }: Props) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [rows, sortKey, sortDir])

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
        No data for this report. Try adjusting your filters.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium text-gray-600 whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  } ${col.sortable ? 'cursor-pointer select-none hover:text-gray-900' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      sortKey === col.key
                        ? sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        : <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedRows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/50">
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={`px-4 py-2.5 whitespace-nowrap ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } text-gray-700`}
                  >
                    {col.format === 'status'
                      ? <StatusBadge value={String(row[col.key] ?? '')} />
                      : formatCell(row[col.key], col.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {showTotals && summary && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                {columns.map((col, i) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 whitespace-nowrap ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } text-gray-900`}
                  >
                    {i === 0 ? 'Total' : col.showTotal && summary[col.key] !== undefined ? formatCell(summary[col.key], col.format) : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
