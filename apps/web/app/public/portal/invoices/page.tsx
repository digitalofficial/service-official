'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Receipt, DollarSign } from 'lucide-react'

export default function PortalInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/portal/invoices').then(r => r.json()).then(d => { setInvoices(d.data || []); setLoading(false) })
  }, [])

  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
  const outstanding = invoices.reduce((sum, inv) => sum + (inv.amount_due || 0), 0)

  if (loading) return <div className="animate-pulse"><div className="h-48 bg-gray-100 rounded-lg" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        {outstanding > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
            <span className="text-sm text-amber-700">Outstanding Balance: <strong>{fmt(outstanding)}</strong></span>
          </div>
        )}
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No invoices yet</h3>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Invoice</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Project</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Issue Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Due Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Due</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/public/invoice/${inv.id}`} className="text-blue-600 hover:underline font-medium">{inv.invoice_number}</Link>
                    {inv.title && <p className="text-xs text-gray-400">{inv.title}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{inv.project?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                      inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      inv.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{inv.issue_date}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.due_date || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{fmt(inv.total)}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {inv.amount_due > 0 ? (
                      <span className="text-red-600">{fmt(inv.amount_due)}</span>
                    ) : (
                      <span className="text-emerald-600">{fmt(0)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
