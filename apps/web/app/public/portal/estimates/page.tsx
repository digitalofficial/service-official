'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, CheckCircle2, Clock, XCircle, ExternalLink } from 'lucide-react'

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: typeof Clock }> = {
  sent: { color: 'bg-blue-100 text-blue-700', label: 'Awaiting Review', icon: Clock },
  viewed: { color: 'bg-sky-100 text-sky-700', label: 'Under Review', icon: Clock },
  approved: { color: 'bg-emerald-100 text-emerald-700', label: 'Approved', icon: CheckCircle2 },
  declined: { color: 'bg-red-100 text-red-700', label: 'Declined', icon: XCircle },
  converted: { color: 'bg-indigo-100 text-indigo-700', label: 'Converted to Invoice', icon: FileText },
}

export default function PortalEstimatesPage() {
  const [estimates, setEstimates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/portal/estimates').then(r => r.json()).then(d => { setEstimates(d.data || []); setLoading(false) })
  }, [])

  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
  const pendingCount = estimates.filter(e => ['sent', 'viewed'].includes(e.status)).length

  if (loading) return <div className="animate-pulse"><div className="h-48 bg-gray-100 rounded-lg" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Estimates</h1>
        {pendingCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <span className="text-sm text-blue-700"><strong>{pendingCount}</strong> estimate{pendingCount > 1 ? 's' : ''} awaiting your review</span>
          </div>
        )}
      </div>

      {estimates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No estimates yet</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {estimates.map(est => {
            const cfg = STATUS_CONFIG[est.status] || STATUS_CONFIG.sent
            const StatusIcon = cfg.icon
            const needsAction = ['sent', 'viewed'].includes(est.status)

            return (
              <div key={est.id} className={`bg-white rounded-lg border p-4 sm:p-5 ${needsAction ? 'border-blue-200 shadow-sm' : 'border-gray-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{est.title || est.estimate_number}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {est.estimate_number}
                      {est.project && <> — {est.project.name}</>}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                      <span>Issued: {est.issue_date}</span>
                      {est.expiry_date && <span>Expires: {est.expiry_date}</span>}
                      {est.approved_at && <span className="text-emerald-600">Approved: {new Date(est.approved_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                    <p className="text-lg font-bold text-gray-900">{fmt(est.total)}</p>
                    {needsAction ? (
                      <a
                        href={`/public/estimate/${est.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Review & Approve
                      </a>
                    ) : (
                      <a
                        href={`/public/estimate/${est.id}`}
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline whitespace-nowrap"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View Estimate
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
