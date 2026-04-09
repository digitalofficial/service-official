'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePortalSession } from '../layout'
import { FolderKanban, Calendar, DollarSign, TrendingUp } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  estimating: 'bg-blue-100 text-blue-700',
  approved: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-amber-100 text-amber-700',
  punch_list: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  invoiced: 'bg-indigo-100 text-indigo-700',
}

export default function PortalDashboardPage() {
  const { session } = usePortalSession()
  const [projects, setProjects] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/portal/projects').then(r => r.json()),
      fetch('/api/portal/invoices').then(r => r.json()),
    ]).then(([projData, invData]) => {
      setProjects(projData.data || [])
      setInvoices(invData.data || [])
      setLoading(false)
    })
  }, [])

  const customerName = session?.customer
    ? (session.customer.first_name || session.customer.company_name || 'there')
    : 'there'

  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
  const outstandingBalance = invoices.reduce((sum, inv) => sum + (inv.amount_due || 0), 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0)

  if (loading) {
    return <div className="space-y-6 animate-pulse"><div className="h-8 bg-gray-200 rounded w-64" /><div className="h-48 bg-gray-100 rounded-lg" /></div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {customerName}</h1>
        <p className="text-gray-500">Here's an overview of your projects and invoices.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <FolderKanban className="w-4 h-4" /> Active Projects
          </div>
          <p className="text-2xl font-bold text-gray-900">{projects.filter(p => !['completed', 'paid', 'canceled'].includes(p.status)).length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <DollarSign className="w-4 h-4" /> Outstanding
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(outstandingBalance)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <TrendingUp className="w-4 h-4" /> Total Paid
          </div>
          <p className="text-2xl font-bold text-emerald-600">{fmt(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Calendar className="w-4 h-4" /> Invoices
          </div>
          <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
        </div>
      </div>

      {/* Projects */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Projects</h2>
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FolderKanban className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No projects yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map(project => (
              <Link
                key={project.id}
                href={`/public/portal/projects/${project.id}`}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-700'}`}>
                    {project.status.replace(/_/g, ' ')}
                  </span>
                </div>
                {project.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium">{project.progress_percent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${project.progress_percent}%` }} />
                  </div>
                </div>
                {project.contract_value && (
                  <p className="text-sm text-gray-500 mt-3">Contract: {fmt(project.contract_value)}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Invoices */}
      {invoices.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
            <Link href="/public/portal/invoices" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Invoice</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-500">Due Date</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-500">Amount Due</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map(inv => (
                  <tr key={inv.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">{inv.invoice_number}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{inv.due_date || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmt(inv.amount_due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
