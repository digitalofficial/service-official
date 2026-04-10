import { getProfile } from '@/lib/auth/get-profile'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Receipt, CheckCircle, Clock, XCircle } from 'lucide-react'
import { AddExpenseButton } from './project-expenses'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Expenses' }

const CATEGORY_LABELS: Record<string, string> = {
  materials: 'Materials', labor: 'Labor', equipment: 'Equipment',
  fuel: 'Fuel', permits: 'Permits', subcontractor: 'Subcontractor',
  tools: 'Tools', dump_fees: 'Dump Fees', insurance: 'Insurance',
  overhead: 'Overhead', other: 'Other',
}

export default async function ProjectExpensesPage({ params }: { params: { id: string } }) {
  const { supabase } = await getProfile()

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, submitter:profiles!submitted_by(first_name, last_name), approver:profiles!approved_by(first_name, last_name)')
    .eq('project_id', params.id)
    .order('expense_date', { ascending: false })

  const totals = {
    total: expenses?.reduce((sum, e) => sum + (e.total_amount ?? 0), 0) ?? 0,
    approved: expenses?.filter(e => e.status === 'approved').reduce((sum, e) => sum + (e.total_amount ?? 0), 0) ?? 0,
    pending: expenses?.filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.total_amount ?? 0), 0) ?? 0,
  }

  const byCategory = expenses?.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + (e.total_amount ?? 0)
    return acc
  }, {} as Record<string, number>) ?? {}

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.total)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.approved)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totals.pending)}</p>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">By Category</h3>
          <div className="space-y-2">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const pct = totals.total > 0 ? (amount / totals.total) * 100 : 0
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{CATEGORY_LABELS[category] ?? category}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">All Expenses ({expenses?.length ?? 0})</h3>
          <AddExpenseButton projectId={params.id} />
        </div>

        {expenses?.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No expenses recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium">Description</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Vendor</th>
                  <th className="text-left px-4 py-3 font-medium">Submitted By</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses?.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900">{expense.title}</p>
                      {expense.description && (
                        <p className="text-xs text-gray-400 truncate max-w-xs">{expense.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {CATEGORY_LABELS[expense.category] ?? expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(expense.expense_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {expense.vendor_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {expense.submitter ? `${expense.submitter.first_name} ${expense.submitter.last_name}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(expense.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={expense.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { icon: any; label: string; className: string }> = {
    pending:     { icon: Clock, label: 'Pending', className: 'bg-amber-50 text-amber-700' },
    approved:    { icon: CheckCircle, label: 'Approved', className: 'bg-green-50 text-green-700' },
    rejected:    { icon: XCircle, label: 'Rejected', className: 'bg-red-50 text-red-700' },
    reimbursed:  { icon: CheckCircle, label: 'Reimbursed', className: 'bg-blue-50 text-blue-700' },
  }
  const config = map[status] ?? map.pending
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}
